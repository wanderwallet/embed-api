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
    role: 'authenticated',
    is_anonymous: false,
    
    // Add any additional user metadata you need
    user_metadata: {
      auth_method: 'passkey',
      name: user.name,
      picture: user.picture,
    }
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
