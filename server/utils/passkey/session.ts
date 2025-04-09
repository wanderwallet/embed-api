import { UserProfile } from '@prisma/client'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.SUPABASE_JWT_SECRET || ''
const jwtIssuer = process.env.SUPABASE_URL || ''

export function createWebAuthnAccessTokenForUser(user: UserProfile) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 3600 // 1 hour expiry
  
  // Create a payload that matches Supabase's expected format
  const payload = {
    iss: jwtIssuer,
    sub: user.supId,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    
    email: user.supEmail,
    phone: user.supPhone,
    app_metadata: {}, // Add app_metadata field
    user_metadata: {
      auth_method: 'passkey',
      name: user.name,
      picture: user.picture,
    },
    role: 'authenticated',
    is_anonymous: false,
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
 */
export function createWebAuthnRefreshTokenForUser(user: UserProfile) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 604800 // 7 days expiry for refresh token
  
  // Create a payload that matches Supabase's expected format for refresh tokens
  const payload = {
    iss: jwtIssuer,
    sub: user.supId,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    
    email: user.supEmail,
    phone: user.supPhone,
    session_id: crypto.randomUUID(), // Generate a session ID for the refresh token
    refresh_token_type: true, // Indicate this is a refresh token
    user_metadata: {
      auth_method: 'passkey',
      name: user.name,
      picture: user.picture,
    },
    role: 'authenticated',
    is_anonymous: false,
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
