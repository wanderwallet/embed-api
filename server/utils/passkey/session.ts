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
