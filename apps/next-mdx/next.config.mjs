import createMDX from '@next/mdx'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  output: 'export'
}

export default createMDX()(nextConfig)
