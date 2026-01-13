import createMDX from '@next/mdx'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  output: 'export',
  // Use a fixed buildId for consistent snapshot testing
  generateBuildId: async () => 'test-build-id',
}

export default createMDX()(nextConfig)
