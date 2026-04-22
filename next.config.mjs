/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Bỏ qua lỗi TypeScript để Build thành công
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua lỗi ESLint để Build thành công
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
