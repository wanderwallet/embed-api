import jwt from "jsonwebtoken"

// TODO: Consider rotating them and sharding them? This way we can reset it "globally"
// without disrupting all users.

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function signJWT(payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}

export async function verifyJWT(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) reject(err)
      resolve(decoded)
    })
  })
}

