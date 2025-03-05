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
      // Find or create default organization for the user
      let org = await ctx.prisma.organization.findFirst({
        where: {
          memberships: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
        select: { id: true },
      });

      if (!org) {
        const slug = generateSlug();
        const orgName =
          (ctx.user?.email?.split("@")[0] || slug) + "'s Organization";

        org = await ctx.prisma.organization.create({
          data: {
            name: orgName,
            slug: `org-${slug}`,
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
            memberships: {
              create: {
                userId: ctx.user.id,
                role: "OWNER",
                organizationId: org.id,
              },
            },
          },
          select: {
            id: true,
            memberships: true,
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
          memberships: {
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
              memberships: true,
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
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          userId: ctx.user.id,
          teamId: input.teamId,
          role: {
            in: ["OWNER", "ADMIN"],
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You don't have permission to create applications in this team",
        });
      }

      return ctx.prisma.application.create({
        data: {
          name: input.name,
          description: input.description,
          domains: input.domains || [],
          teamId: input.teamId,
          settings: {},
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
            memberships: {
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
          clientId: true,
          team: {
            select: {
              name: true,
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
          memberships: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
      }),
      ctx.prisma.application.count({
        where: {
          team: {
            memberships: {
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
          memberships: {
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
              memberships: true,
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
          memberships: {
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
          memberships: {
            some: {
              userId: ctx.user.id,
              role: "OWNER",
            },
          },
        },
        include: {
          organization: {
            select: {
              name: true,
              teams: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or insufficient permissions",
        });
      }

      if (team.organization.teams.length === 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete the organization's only team",
        });
      }

      const otherMemberships = await ctx.prisma.membership.findFirst({
        where: {
          userId: ctx.user.id,
          teamId: {
            not: input.id,
          },
        },
      });

      if (!otherMemberships) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete your only team membership",
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
            memberships: {
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
          clientId: true,
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
            memberships: {
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
            memberships: {
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
