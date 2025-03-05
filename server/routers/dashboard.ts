import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";

// Create a custom nanoid function that uses lowercase letters and numbers
const generateSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

export const dashboardRouter = {
  // Teams
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let org = await ctx.prisma.organization.findFirst({
        where: { ownerId: ctx.user.id },
      });

      if (!org) {
        const slug = generateSlug();
        const orgName =
          (ctx.user?.email?.split("@")[0] || slug) + "'s Default Org";
        org = await ctx.prisma.organization.create({
          data: {
            name: orgName,
            slug: `org-${slug}`,
            ownerId: ctx.user.id,
          },
        });
      }

      try {
        return await ctx.prisma.team.create({
          data: {
            name: input.name,
            slug: input.slug,
            organizationId: org.id,
            members: {
              create: {
                userId: ctx.user.id,
                role: "OWNER",
                organizationId: org.id,
              },
            },
          },
          include: {
            members: true,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Team with this slug already exists in the organization",
            });
          }
        }
        throw error;
      }
    }),

  listTeams: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.team.findMany({
        where: {
          organizationId: input?.organizationId,
          members: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
        include: {
          organization: true,
          _count: {
            select: {
              members: true,
              applications: true,
            },
          },
        },
      });
    }),

  // Applications
  createApplication: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        teamId: z.string().uuid(),
        domains: z.array(z.string().max(255)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to create application in team
      const teamMember = await ctx.prisma.teamMember.findFirst({
        where: {
          userId: ctx.user.id,
          teamId: input.teamId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to create applications in this team",
        });
      }

      return ctx.prisma.application.create({
        data: {
          name: input.name,
          description: input.description,
          domains: input.domains || [],
          teamId: input.teamId,
          settings: {},
          clientId: {
            create: {
              name: `${input.name} Client Id`,
            },
          },
        },
        include: {
          team: true,
        },
      });
    }),

  listApplications: protectedProcedure
    .input(
      z
        .object({
          teamId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.application.findMany({
        where: {
          teamId: input?.teamId,
          team: {
            members: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
        include: {
          team: true,
          clientId: true,
        },
      });
    }),

  // Stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [organizations, teams, applications, apiKeys] = await Promise.all([
      ctx.prisma.organization.count({
        where: {
          OR: [
            { ownerId: ctx.user.id },
            {
              TeamMember: {
                some: {
                  userId: ctx.user.id,
                },
              },
            },
          ],
        },
      }),
      ctx.prisma.team.count({
        where: {
          members: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
      }),
      ctx.prisma.application.count({
        where: {
          team: {
            members: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
      }),
      ctx.prisma.clientId.count({
        where: {
          application: {
            team: {
              members: {
                some: {
                  userId: ctx.user.id,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      organizations,
      teams,
      applications,
      apiKeys,
    };
  }),
};
