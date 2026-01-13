import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import preact from '@astrojs/preact'

export default defineConfig({
  integrations: [
    mdx(),
    react({ include: ['**/react/*'] }),
    preact({ include: ['**/preact/*'] })
  ],
  server: {
    port: 4321
  }
})
