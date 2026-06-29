import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@flaus/ui-forms'],
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/onboarding/help',
        destination: '/onboarding',
        permanent: false,
      },
      {
        source: '/onboarding/help/:path*',
        destination: '/onboarding',
        permanent: false,
      },
    ]
  },
}

export default withPayload(nextConfig)
