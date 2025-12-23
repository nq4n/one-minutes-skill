import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["ffmpeg-static", "@remotion/install-whisper-cpp"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uvaymtilhfqlcukofshh.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tzdhnkscbtwpwsgabvit.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
