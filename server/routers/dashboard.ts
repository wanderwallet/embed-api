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
        select: { id: true },
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
          select: { id: true },
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
          select: {
            id: true,
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
        select: {
          id: true,
          name: true,
          organization: {
            select: {
              name: true,
            },
          },
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
      const teamMember = await ctx.prisma.teamMember.findFirst({
        where: {
          userId: ctx.user.id,
          teamId: input.teamId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
        select: { id: true },
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
        select: {
          id: true,
          name: true,
          team: {
            select: {
              name: true,
            },
          },
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
        select: {
          id: true,
          name: true,
          description: true,
          team: {
            select: {
              name: true,
            },
          },
          clientId: {
            select: {
              id: true,
            },
          },
        },
      });
    }),

  // Stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [teams, applications] = await Promise.all([
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
    ]);

    return {
      teams,
      applications,
    };
  }),

  getTeam: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          organization: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              applications: true,
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      return team;
    }),

  updateTeam: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.user.id,
              role: {
                in: ["OWNER", "ADMIN"],
              },
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or you don't have permission to update it",
        });
      }

      return ctx.prisma.team.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),

  deleteTeam: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.user.id,
              role: "OWNER",
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or you don't have permission to delete it",
        });
      }

      return ctx.prisma.team.delete({ where: { id: input.id } });
    }),

  getApplication: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.prisma.application.findFirst({
        where: {
          id: input.id,
          team: {
            members: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          domains: true,
          team: {
            select: {
              name: true,
            },
          },
          clientId: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      return application;
    }),

  updateApplication: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        domains: z.array(z.string().max(255)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.application.findFirst({
        where: {
          id: input.id,
          team: {
            members: {
              some: {
                userId: ctx.user.id,
                role: {
                  in: ["OWNER", "ADMIN"],
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Application not found or you don't have permission to update it",
        });
      }

      return ctx.prisma.application.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          domains: input.domains,
        },
      });
    }),

  deleteApplication: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.application.findFirst({
        where: {
          id: input.id,
          team: {
            members: {
              some: {
                userId: ctx.user.id,
                role: {
                  in: ["OWNER", "ADMIN"],
                },
              },
            },
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Application not found or you don't have permission to delete it",
        });
      }

      return ctx.prisma.application.delete({
        where: { id: input.id },
      });
    }),
};
