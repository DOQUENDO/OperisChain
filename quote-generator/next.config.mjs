/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse uses pdfjs-dist which is incompatible with webpack bundling.
  // mailparser and xlsx also have Node.js-specific modules.
  // Mark them as external so they're loaded at runtime by Node.js, not bundled.
  // Next.js 14 uses "experimental.serverComponentsExternalPackages"
  experimental: {
    serverComponentsExternalPackages: [
      "pdf-parse",
      "pdfjs-dist",
      "mailparser",
      "xlsx",
    ],
  },
};

export default nextConfig;
