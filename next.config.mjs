/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite is a built-in module; keep it external to the server bundle.
  serverExternalPackages: ["node:sqlite", "nodemailer"],
  images: {
    // picsum is only used by the (now removed) mock data; real photos are served
    // locally from /uploads. Kept here so any leftover picsum URLs still render.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
