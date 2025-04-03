import { PrismaClient } from "@prisma/client";

// Create a base Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const basePrisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

// Function to create an authenticated Prisma client instance
export function createAuthenticatedPrismaClient(jwtToken?: string, role?: string) {
  // If no token, return the base client
  if (!jwtToken && !role) {
    return basePrisma;
  }

  // Create a new client with extensions to handle authentication
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  return prisma.$extends({
    client: {
      async $beforeQuery() {
        // Set PostgreSQL role and JWT claims via raw queries before each operation
        if (role) {
          await prisma.$executeRawUnsafe(`SET ROLE ${role}`);
        }
        
        if (jwtToken) {
          const claimsJson = JSON.stringify({ sub: jwtToken, role });
          await prisma.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '${claimsJson}'`);
        }
      }
    }
  });
}
