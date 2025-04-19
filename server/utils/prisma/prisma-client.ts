import { PrismaClient } from "@prisma/client";

// Create a singleton Prisma client instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL, // Use connection pooling
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Function to create an authenticated Prisma client by extending the base client
export function createAuthenticatedPrismaClient(userId?: string, role?: string) {
  if (!userId && !role) {
    return prisma;
  }

  // Extend the existing Prisma client with authentication context
  return prisma.$extends({
    name: 'auth-context',
    query: {
      $allModels: {
        $allOperations({ args, query }) {
          try {
            // Set PostgreSQL role via raw queries before each operation
            if (role) {
              prisma.$executeRawUnsafe(`SET ROLE ${role}`);
            }
            
            if (userId) {
              // Format claims in the way Supabase RLS expects them
              const claimsJson = JSON.stringify({
                sub: userId,
                role,
                aud: "authenticated",
                // Include additional standard claims that might be used in RLS policies
                auth: {
                  uid: userId,
                  role: role || "authenticated",
                }
              });
              
              // Set the JWT claims for the current transaction
              prisma.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '${claimsJson}'`);
            }
          } catch (error) {
            console.error("Error setting authentication context:", error);
            // Continue with the query even if setting auth fails
          }
          
          // Execute the original query after setting the context
          return query(args);
        }
      }
    }
  });
}
