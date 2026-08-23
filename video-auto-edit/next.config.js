/** @type {import('next').NextConfig} */
const nextConfig = {
  // 動画アップロードを扱う API Route のボディサイズ上限を緩和
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
};

module.exports = nextConfig;
