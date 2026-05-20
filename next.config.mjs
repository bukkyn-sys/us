/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // Google profile photos
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Allow any HTTPS source for OG images (fetched via Cloud Function, not client)
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
