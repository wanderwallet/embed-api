import { UserProfile } from '@prisma/client'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.SUPABASE_JWT_SECRET || ''
const jwtIssuer = process.env.SUPABASE_URL || ''

/**
 * Creates an access token for WebAuthn authentication that works with Supabase Auth.
 * 
 * This token is compatible with the custom_access_token_hook function that adds additional
 * session metadata to the JWT claims.
 * 
 * @param user The user profile
 * @param sessionData Optional session data to include in the token
 */
export function createWebAuthnAccessTokenForUser(
  user: UserProfile, 
  sessionData?: {
    id?: string;
    deviceNonce?: string;
    ip?: string;
    userAgent?: string;
    createdAt?: Date;
    updatedAt?: Date;
    applicationIds?: string[];
  }
) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 3600 // 1 hour expiry
  
  // Define the payload type with optional session_id
  type JWTPayload = {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    email: string | null;
    phone: string | null;
    app_metadata: {
      provider: string;
      providers: string[];
      [key: string]: unknown;
    };
    user_metadata: {
      name: string | null;
      picture: string | null;
      auth_method?: string;
    };
    role: string;
    is_anonymous: boolean;
    session_id?: string;
    // Session data at root level
    ip?: string;
    userAgent?: string;
    deviceNonce?: string;
    applicationIds?: string[];
  }
  
  // Create a payload that matches Supabase's expected format
  const payload: JWTPayload = {
    iss: jwtIssuer,
    sub: user.supId,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    
    email: user.supEmail,
    phone: user.supPhone,
    app_metadata: {
      provider: 'passkey',
      providers: ['passkey'],
    }, 
    user_metadata: {
      name: user.name,
      picture: user.picture,
      auth_method: 'passkey',
    },
    role: 'authenticated',
    is_anonymous: false,
  }

  // Add session_id to the token if provided
  if (sessionData?.id) {
    payload.session_id = sessionData.id;
  }
  
  // Add session data at root level
  if (sessionData) {
    if (sessionData.ip) payload.ip = sessionData.ip;
    if (sessionData.userAgent) payload.userAgent = sessionData.userAgent;
    if (sessionData.deviceNonce) payload.deviceNonce = sessionData.deviceNonce;
    if (sessionData.applicationIds) payload.applicationIds = sessionData.applicationIds;
  }

  const token = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  })
  
  return token
}

/**
 * Creates a refresh token for WebAuthn authentication that works with Supabase Auth.
 * 
 * The refresh token follows Supabase's expected JWT format for refresh tokens:
 * - Has a longer expiration time (7 days vs 1 hour for access tokens)
 * - Includes a session_id that Supabase uses to track the session
 * - Sets refresh_token_type: true to indicate it's a refresh token
 * - Contains the same user identity information as the access token
 * 
 * This token can be used with supabase.auth.refreshSession() on the client side
 * to get a new access token without requiring re-authentication.
 * 
 * @param user The user profile
 * @param sessionId The existing session ID to associate with this refresh token
 * @param sessionData Optional additional session data
 */
export function createWebAuthnRefreshTokenForUser(
  user: UserProfile, 
  sessionId?: string,
  sessionData?: {
    deviceNonce?: string;
    ip?: string;
    userAgent?: string;
    createdAt?: Date;
    updatedAt?: Date;
    applicationIds?: string[];
  }
) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 604800 // 7 days expiry for refresh token
  
  // Define payload type with refresh token specifics
  type RefreshTokenPayload = {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    email: string | null;
    phone: string | null;
    session_id: string;
    refresh_token_type: boolean;
    app_metadata: {
      provider: string;
      providers: string[];
      [key: string]: unknown;
    };
    user_metadata: {
      name: string | null;
      picture: string | null;
      auth_method?: string;
    };
    role: string;
    is_anonymous: boolean;
    // Session data at root level
    ip?: string;
    userAgent?: string;
    deviceNonce?: string;
    applicationIds?: string[];
  }
  
  // Create a payload that matches Supabase's expected format for refresh tokens
  const payload: RefreshTokenPayload = {
    iss: jwtIssuer,
    sub: user.supId,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    
    email: user.supEmail,
    phone: user.supPhone,
    session_id: sessionId || crypto.randomUUID(), // Use provided session ID or generate one as fallback
    refresh_token_type: true, // Indicate this is a refresh token
    app_metadata: {
      provider: 'passkey',
      providers: ['passkey'],
    },
    user_metadata: {
      name: user.name,
      picture: user.picture,
      auth_method: 'passkey',
    },
    role: 'authenticated',
    is_anonymous: false,
  }
  
  // Add session data at root level
  if (sessionData) {
    if (sessionData.ip) payload.ip = sessionData.ip;
    if (sessionData.userAgent) payload.userAgent = sessionData.userAgent;
    if (sessionData.deviceNonce) payload.deviceNonce = sessionData.deviceNonce;
    if (sessionData.applicationIds) payload.applicationIds = sessionData.applicationIds;
  }

  const token = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  })
  
  return token
}
