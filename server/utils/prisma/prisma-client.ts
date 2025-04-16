import { PrismaClient } from "@prisma/client";

// Create a base Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const basePrisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL, // Use connection pooler
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

// Function to create an authenticated Prisma client instance
export function createAuthenticatedPrismaClient(userId?: string, role?: string) {
  // User ID is required for authenticated client
  // It should be extracted from the JWT token
  if (!userId && !role) {
    return basePrisma;
  }

  // Create a new client with extensions to handle authentication
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL, // Use connection pooler
      },
    },
  });

  return prisma.$extends({
    client: {
      async $beforeQuery() {
        try {
          // Set PostgreSQL role via raw queries before each operation
          if (role) {
            await prisma.$executeRawUnsafe(`SET ROLE ${role}`);
          }
          
          if (userId) {
            // Format claims in the way Supabase RLS expects them
            // This matches the claims structure used by Supabase's auth system
            const claimsJson = JSON.stringify({
              sub: userId,
              role,
              aud: "authenticated",
              // Include additional standard claims that might be used in RLS policies
              // These are common auth claims used in Supabase RLS
              auth: {
                uid: userId,
                role: role || "authenticated",
              }
            });
            
            // Set the JWT claims for the current transaction
            await prisma.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '${claimsJson}'`);
          }
        } catch (error) {
          console.error("Error setting authentication context:", error);
          // Continue with the query even if setting auth fails
          // This allows unauthenticated access to public resources
        }
      }
    }
  });
}
