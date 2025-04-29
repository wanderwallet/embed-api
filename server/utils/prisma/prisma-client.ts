import { PrismaClient, Prisma } from "@prisma/client";

// Global client cache for initialized connections
const clientCache = new Map<string, {
  client: PrismaClient;
  initialized: boolean; // Track if JWT claims are set
}>();

// Base Prisma client (singleton) for unauthenticated operations
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient 
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Create an authenticated client with JWT claims
export function createAuthenticatedPrismaClient(userId: string) {
  console.log(`Getting authenticated Prisma client for user ${userId}`);
  
  // Check if we have a cached client that's fully initialized
  const cached = clientCache.get(userId);
  if (cached?.initialized) {
    console.log(`Using cached connection for user ${userId}`);
    return applyExtensions(cached.client, userId);
  }
  
  // Create a new PrismaClient with non-pooled connection
  console.log(`Creating new connection for user ${userId}`);
  const userClient = new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });
  
  // Store in cache as uninitialized
  clientCache.set(userId, {
    client: userClient,
    initialized: false
  });
  
  // Create extended client with middleware that ensures JWT claims are set
  const extendedClient = userClient.$extends({
    name: 'auth-context',
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          try {
            // Ensure JWT claims are set before executing any query
            await ensureJwtClaimsSet(userClient, userId);
            
            // Special handling for wallet searches
            if (model === 'Wallet' && (operation === 'findUnique' || operation === 'findFirst')) {
              console.log(`Wallet lookup operation: ${operation}`, JSON.stringify(args));
              
              // Add additional logging for wallet searches
              try {
                // Direct SQL query to check if wallet exists bypassing RLS
                const walletId = args.where?.id;
                if (walletId) {
                  const results = await userClient.$queryRawUnsafe(`
                    SELECT id, "userId" FROM "Wallets" WHERE id = '${walletId}'
                  `);
                  console.log(`Direct wallet lookup results:`, results);
                }
              } catch (error) {
                console.error(`Error during direct wallet lookup:`, error);
              }
            }
            
            // For create operations, ensure userId is included in models that require it
            if (operation.includes('create')) {
              const modelsWithUserId = ['DeviceAndLocation', 'Challenge', 'Session'];
              
              if (modelsWithUserId.some(m => model.includes(m))) {
                const argsWithData = args as { data?: Record<string, unknown> };
                if (argsWithData.data && typeof argsWithData.data === 'object') {
                  if (!('userId' in argsWithData.data)) {
                    argsWithData.data = { 
                      ...argsWithData.data, 
                      userId 
                    };
                  }
                }
              }
            }

            // Log operations for debugging
            if (['create', 'update', 'delete'].includes(operation)) {
              console.log(`DB operation: ${model}.${operation} for user ${userId}`);
            }

            // Execute the query
            return await query(args);
          } catch (error) {
            console.error(`DB error in ${model}.${operation}:`, error);
            throw error;
          }
        }
      }
    }
  });
  
  // Set up connection cleanup
  if (typeof window === 'undefined') {
    process.once('beforeExit', () => {
      cleanupConnection(userId);
    });
  }
  
  return extendedClient;
}

// Ensure JWT claims are set for a client
async function ensureJwtClaimsSet(client: PrismaClient, userId: string): Promise<void> {
  // Check if we already initialized this client
  const cached = clientCache.get(userId);
  if (cached?.initialized) {
    return;
  }

  try {
    // Log connection attempt
    console.log(`Setting JWT claims for user ${userId} - connection not yet initialized`);
    
    // Set JWT claims with session-level SET (not LOCAL)
    const jwtClaims = JSON.stringify({
      sub: userId,
      role: 'authenticated'
    });
    
    // Escape single quotes for SQL safety
    const escapedClaims = jwtClaims.replace(/'/g, "''");
    
    // Verify current JWT setting
    try {
      const currentSetting = await client.$queryRaw`SELECT current_setting('request.jwt.claims', true)`;
      console.log(`Current JWT claims before setting: ${JSON.stringify(currentSetting)}`);
    } catch (error) {
      console.log(`No current JWT claims set`);
    }
    
    // Use direct raw query to ensure claims are set
    await client.$executeRawUnsafe(
      `SET request.jwt.claims = '${escapedClaims}'`
    );
    
    // Verify claims were set
    try {
      const afterSetting = await client.$queryRaw`SELECT current_setting('request.jwt.claims', true)`;
      console.log(`JWT claims after setting: ${JSON.stringify(afterSetting)}`);
    } catch (error) {
      console.error(`Failed to verify JWT claims: ${error}`);
    }
    
    console.log(`JWT claims set for user ${userId}`);
    
    // Mark client as initialized
    clientCache.set(userId, {
      client,
      initialized: true
    });
  } catch (error) {
    console.error(`Error setting JWT claims for user ${userId}:`, error);
    throw error; // Important: propagate error to prevent operations with missing claims
  }
}

// Apply extensions to a client
function applyExtensions(client: PrismaClient, userId: string) {
  return client.$extends({
    name: 'auth-context',
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          try {
            // For create operations, ensure userId is included in models that require it
            if (operation.includes('create')) {
              const modelsWithUserId = ['DeviceAndLocation', 'Challenge', 'Session'];
              
              if (modelsWithUserId.some(m => model.includes(m))) {
                const argsWithData = args as { data?: Record<string, unknown> };
                if (argsWithData.data && typeof argsWithData.data === 'object') {
                  if (!('userId' in argsWithData.data)) {
                    argsWithData.data = { 
                      ...argsWithData.data, 
                      userId 
                    };
                  }
                }
              }
            }

            // Log operations for debugging
            if (['create', 'update', 'delete'].includes(operation)) {
              console.log(`DB operation: ${model}.${operation} for user ${userId}`);
            }

            // Execute the query
            return await query(args);
          } catch (error) {
            console.error(`DB error in ${model}.${operation}:`, error);
            throw error;
          }
        }
      }
    }
  });
}

// Helper to clean up a connection
async function cleanupConnection(userId: string): Promise<void> {
  const cached = clientCache.get(userId);
  if (cached) {
    console.log(`Closing connection for user ${userId}`);
    await cached.client.$disconnect();
    clientCache.delete(userId);
  }
}

// Cleanup all connections (use on server shutdown)
export async function cleanupAllConnections(): Promise<void> {
  console.log(`Cleaning up all database connections`);
  // Convert to array to avoid TypeScript iterator issues
  const entries = Array.from(clientCache.entries());
  for (const [userId, cached] of entries) {
    await cached.client.$disconnect();
  }
  clientCache.clear();
}