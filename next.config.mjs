/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "*" },
          // Add Permissions-Policy for WebAuthn in API routes
          { key: "Permissions-Policy", value: "publickey-credentials-get=*" }
        ]
      },
    ]
  }
}

export default nextConfig;
