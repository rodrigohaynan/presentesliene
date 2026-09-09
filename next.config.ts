import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Mantém title/description/og:image no <head> inicial também para crawlers
  // de compartilhamento como WhatsApp, Facebook e Instagram.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
