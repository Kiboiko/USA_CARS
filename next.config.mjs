/** @type {import('next').NextConfig} */
const nextConfig = {
  // node:sqlite is a built-in module; keep it external to the server bundle.
  serverExternalPackages: ["node:sqlite", "nodemailer"],
};

export default nextConfig;
