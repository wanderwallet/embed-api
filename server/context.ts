import { inferAsyncReturnType } from "@trpc/server"
import { Session } from "@prisma/client";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { jwtDecode } from "jwt-decode";
import { prisma } from "./utils/prisma/prisma-client";
import {
  getClientIp,
  getIpInfo,
} from "./utils/ip/ip.utils";

// Node.js equivalent of browser's atob function
function nodeDecode(base64String: string): string {
  return Buffer.from(base64String, 'base64').toString('utf-8');
}

export async function createContext({ req }: { req: Request }) {

  const authHeader = req.headers.get("authorization");
  const customAuthHeader = req.headers.get("x-custom-auth");
  const clientId = req.headers.get("x-client-id");
  const applicationId = req.headers.get("x-application-id") || "";

  if ((!authHeader && !customAuthHeader) || !clientId) {
    console.log("Missing required headers for authentication");
    return createEmptyContext();
  }

  const userAgent = req.headers.get("user-agent") || "";
  const deviceNonce = req.headers.get("x-device-nonce") || "";
  let ip = getClientIp(req);

  if (process.env.NODE_ENV === "development") {
    const ipInfo = await getIpInfo();
    if (ipInfo) {
      ({ ip } = ipInfo);
    }
  }

  // Prioritize the custom auth token if present
  if (customAuthHeader) {
    console.log("Processing custom auth token");
    try {
      // Parse the base64 encoded JSON token using Node.js Buffer
      let decodedTokenString;
      try {
        decodedTokenString = nodeDecode(customAuthHeader);
        console.log("Decoded token string length:", decodedTokenString.length);
      } catch (decodeError) {
        console.error("Failed to decode custom auth token:", decodeError);
        console.log("Raw token (first 50 chars):", customAuthHeader.substring(0, 50));
        return createEmptyContext();
      }
      
      let decodedToken;
      try {
        decodedToken = JSON.parse(decodedTokenString);
        console.log("Parsed token with fields:", Object.keys(decodedToken));
      } catch (parseError) {
        console.error("Failed to parse token JSON:", parseError);
        console.log("Decoded string:", decodedTokenString);
        return createEmptyContext();
      }
      
      // Validate the token (basic checks)
      if (!decodedToken.user_id || !decodedToken.session_id) {
        console.error("Invalid custom auth token format - missing required fields");
        console.log("Token fields:", Object.keys(decodedToken));
        return createEmptyContext();
      }
      
      // Check token expiration
      if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
        console.error("Custom auth token expired");
        return createEmptyContext();
      }
      
      // Fetch the user from the database
      const userProfile = await prisma.userProfile.findUnique({
        where: { supId: decodedToken.user_id }
      });
      
      if (!userProfile) {
        console.error("User not found for custom auth token");
        return createEmptyContext();
      }
      
      console.log("Found user profile for custom auth:", {
        id: userProfile.supId,
        email: userProfile.supEmail ? "present" : "missing"
      });
      
      // Look for the session in the database to validate
      const sessionRecord = await prisma.session.findUnique({
        where: { id: decodedToken.session_id }
      });
      
      if (!sessionRecord) {
        console.log("Session not found in database, creating new session record");
        
        // If session doesn't exist, create it based on the token data
        const newSessionId = decodedToken.session_id || crypto.randomUUID();
        const newDeviceNonce = decodedToken.device_nonce || deviceNonce || crypto.randomUUID();
        
        try {
          await prisma.session.create({
            data: {
              id: newSessionId,
              userId: decodedToken.user_id,
              deviceNonce: newDeviceNonce,
              ip: ip ? ip.split(',')[0].trim() : '127.0.0.1',
              userAgent,
              createdAt: new Date(decodedToken.iat ? decodedToken.iat * 1000 : Date.now()),
              updatedAt: new Date()
            }
          });
          
          console.log("Created session from token data:", newSessionId);
        } catch (sessionError) {
          console.error("Failed to create session:", sessionError);
          // Continue anyway - the session might exist but we couldn't find it
        }
      } else {
        console.log("Found existing session:", sessionRecord.id);
      }
      
      // Create a session object from the decoded token
      const sessionData = {
        userId: decodedToken.user_id,
        id: decodedToken.session_id,
        deviceNonce: deviceNonce || decodedToken.device_nonce,
        ip,
        userAgent,
        createdAt: new Date(decodedToken.iat ? decodedToken.iat * 1000 : Date.now()),
        updatedAt: new Date()
      };
      
      console.log("Created session object with ID:", sessionData.id);
      
      return {
        prisma,
        user: {
          id: userProfile.supId,
          email: userProfile.supEmail
        },
        session: createSessionObject(sessionData, applicationId),
      };
    } catch (error) {
      console.error("Error processing custom auth token:", error);
      return createEmptyContext();
    }
  }

  // Standard JWT auth flow (only if custom auth was not processed)
  if (!authHeader) {
    return createEmptyContext();
  }
  
  const token = authHeader.split(" ")[1];
  if (!token) return createEmptyContext();

  console.log("Processing auth header token:", token.substring(0, 10) + "...");
  
  // Check if this might be a custom token (not a JWT) before trying to validate it
  // JWTs must have exactly 3 segments separated by dots
  const segments = token.split('.');
  const looksLikeJwt = segments.length === 3;
  
  if (!looksLikeJwt) {
    console.log("Token doesn't look like a JWT - it has", segments.length, "segments instead of 3");
    console.log("Attempting to process as custom token instead");
    
    // Try to process it as a custom auth token
    try {
      // Attempt to decode it as a base64 string
      const decodedTokenString = nodeDecode(token);
      
      // Try to parse it as JSON
      const decodedToken = JSON.parse(decodedTokenString);
      
      // Check if it has the expected properties of our custom token
      if (decodedToken.user_id && decodedToken.session_id) {
        console.log("Successfully identified as custom token in Authorization header");
        
        // Create a modified request with the token in the correct header
        const modifiedRequest = new Request(req.url, {
          method: req.method,
          headers: new Headers(req.headers),
          body: req.body,
        });
        
        // Remove from Authorization
        modifiedRequest.headers.delete("authorization");
        
        // Add to X-Custom-Auth
        modifiedRequest.headers.set("x-custom-auth", token);
        
        return createContext({ req: modifiedRequest });
      }
    } catch (recoveryError) {
      console.log("Failed to process as custom token:", recoveryError);
      // Fall through to standard JWT processing if this fails
    }
  }
  
  console.log("Proceeding with standard JWT validation");
  const supabase = await createServerClient(userAgent);

  // We should be retrieving the session to make sure we are not using a token from a logged out session.
  // See https://supabase.com/docs/guides/auth/sessions#how-do-i-make-sure-that-an-access-token-jwt-cannot-be-used-after-a-user-clicks-sign-out

  // The right method to use is `supabase.auth.getUser(token)`, not `supabase.auth.getSession`.
  // See https://supabase.com/docs/reference/javascript/auth-getuser

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Error verifying session:", error);
      
      // Handle case where token might be a custom token sent in the wrong header
      if (error.message?.includes("invalid JWT") || error.message?.includes("malformed")) {
        console.log("Detected potentially custom token in Authorization header, attempting recovery");
        
        // Try to process it as a custom token directly here instead of creating a new Request
        try {
          const potentialCustomToken = token;
          const decodedTokenString = nodeDecode(potentialCustomToken);
          const decodedToken = JSON.parse(decodedTokenString);
          
          if (decodedToken.user_id && decodedToken.session_id) {
            console.log("Successfully parsed as custom token, processing directly");
            
            // Get the user profile directly
            const userProfile = await prisma.userProfile.findUnique({
              where: { supId: decodedToken.user_id }
            });
            
            if (!userProfile) {
              console.error("User not found for recovered custom token");
              return createEmptyContext();
            }
            
            console.log("Found user profile for recovered token:", {
              id: userProfile.supId,
              email: userProfile.supEmail ? "present" : "missing"
            });
            
            // Look for the session in the database
            const sessionRecord = await prisma.session.findUnique({
              where: { id: decodedToken.session_id }
            });
            
            if (!sessionRecord) {
              console.log("Session not found for recovered token, creating new session record");
              
              // Create a new session if needed
              const newSessionId = decodedToken.session_id || crypto.randomUUID();
              const newDeviceNonce = decodedToken.device_nonce || deviceNonce || crypto.randomUUID();
              
              try {
                await prisma.session.create({
                  data: {
                    id: newSessionId,
                    userId: decodedToken.user_id,
                    deviceNonce: newDeviceNonce,
                    ip: ip ? ip.split(',')[0].trim() : '127.0.0.1',
                    userAgent,
                    createdAt: new Date(decodedToken.iat ? decodedToken.iat * 1000 : Date.now()),
                    updatedAt: new Date()
                  }
                });
                
                console.log("Created session for recovered token:", newSessionId);
              } catch (sessionError) {
                console.error("Failed to create session for recovered token:", sessionError);
              }
            } else {
              console.log("Found existing session for recovered token:", sessionRecord.id);
            }
            
            // Create a session object
            const sessionData = {
              userId: decodedToken.user_id,
              id: decodedToken.session_id,
              deviceNonce: deviceNonce || decodedToken.device_nonce,
              ip,
              userAgent,
              createdAt: new Date(decodedToken.iat ? decodedToken.iat * 1000 : Date.now()),
              updatedAt: new Date()
            };
            
            console.log("Created session object for recovered token:", sessionData.id);
            
            return {
              prisma,
              user: {
                id: userProfile.supId,
                email: userProfile.supEmail
              },
              session: createSessionObject(sessionData, applicationId),
            };
          }
        } catch (recoveryError) {
          console.log("Recovery attempt failed:", recoveryError);
        }
      }
      
      return createEmptyContext();
    }

    const user = data.user;
    console.log("Found user from JWT:", {
      id: user?.id ? "present" : "missing",
    });

    try {
      // Get the session data from the token
      // This is used for validation purposes, but we don't need to manually create/update the session
      // as the database triggers will handle that automatically
      const sessionData = await getAndUpdateSession(token, {
        userAgent,
        deviceNonce,
        ip,
      });

      // TODO: Get `data.user.user_metadata.ipFilterSetting` and `data.user.user_metadata.countryFilterSetting` and
      // check if they are defined and, if so, if they pass.
      console.log("Created session from JWT with ID:", sessionData.id);

      return {
        prisma,
        user,
        session: createSessionObject(sessionData, applicationId),
      };
    } catch (error) {
      console.error("Error processing session:", error);
      return createEmptyContext();
    }
  } catch (error) {
    console.error("Unexpected error during auth:", error);
    return createEmptyContext();
  }
}

async function getAndUpdateSession(
  token: string,
  updates: Pick<Session, "userAgent" | "deviceNonce" | "ip">
): Promise<Session> {
  try {
    const decoded = decodeJwt(token);
    const { sub: userId, session_id: sessionId, sessionData } = decoded;

    const sessionUpdates: Partial<typeof updates> = {};
    for (const [key, value] of Object.entries(updates) as [
      keyof typeof updates,
      string
    ][]) {
      if (value && sessionData?.[key] !== value) {
        sessionUpdates[key] = value;
      }
    }

    if (Object.keys(sessionUpdates).length > 0) {
      console.log("Updating session:", sessionUpdates);

      try {
        prisma.session
          .update({
            where: { id: sessionId },
            data: sessionUpdates,
          })
          .catch((error) => {
            console.error("Error updating session:", error);
          });
      } catch (dbError) {
        console.error("Failed to update session:", dbError);
      }
    }

    return {
      userId,
      id: sessionId,
      ...sessionData,
      ...sessionUpdates,
    } satisfies Session;
  } catch (error) {
    console.error("Failed to decode or process JWT:", error);
    
    // Return a minimal valid session to avoid crashes
    return {
      userId: "",
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceNonce: "",
      ip: "127.0.0.1",
      userAgent: "",
    } satisfies Session;
  }
}

function decodeJwt(token: string) {
  try {
    // Check if the token looks like a JWT (has 3 segments)
    if (token.split(".").length !== 3) {
      throw new Error("Token does not have 3 segments required for a JWT");
    }
    
    return jwtDecode(token) as {
      sub: string;
      session_id: string;
      sessionData: Omit<Session, "id" | "userId">;
    };
  } catch (error) {
    console.error("JWT decode error:", error);
    // Return minimal valid data structure that matches the expected type
    return {
      sub: "",
      session_id: "",
      sessionData: {
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceNonce: "",
        ip: "127.0.0.1",
        userAgent: "",
      }
    };
  }
}

function createEmptyContext() {
  return {
    prisma,
    user: null,
    session: createSessionObject(null),
  };
}

function createSessionObject(
  sessionData: Session | null,
  applicationId?: string
): Session & { applicationId: string } {
  // TODO: How to link `Session` to `Applications`?
  // Note the following data is used for challenge validation:
  //
  // - session.id,
  // - session.ip,
  // - session.deviceNonce,
  // - session.userAgent,

  return {
    id: sessionData?.id || "",
    createdAt: sessionData?.createdAt || new Date(),
    updatedAt: sessionData?.updatedAt || new Date(),
    deviceNonce: sessionData?.deviceNonce || "",
    ip: sessionData?.ip || "",
    userAgent: sessionData?.userAgent || "",
    userId: sessionData?.userId || "",
    applicationId: applicationId || "",
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
