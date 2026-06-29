import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === 'production' ? '/staff' : '')

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
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
