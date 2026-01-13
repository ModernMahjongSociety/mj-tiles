import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import preact from '@astrojs/preact'
import solid from '@astrojs/solid-js'

export default defineConfig({
  integrations: [
    mdx(),
    react({ include: ['**/react/*'] }),
    preact({ include: ['**/preact/*'] }),
    solid({ include: ['**/solid/*'] })
  ],
  server: {
    port: 4321
  }
})
