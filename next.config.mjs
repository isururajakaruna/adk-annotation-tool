/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // For Docker deployment
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  env: {
    AGENT_ENGINE_PROJECT_ID: process.env.AGENT_ENGINE_PROJECT_ID,
    AGENT_ENGINE_LOCATION: process.env.AGENT_ENGINE_LOCATION,
    AGENT_ENGINE_RESOURCE_ID: process.env.AGENT_ENGINE_RESOURCE_ID,
  },
};

export default nextConfig;


