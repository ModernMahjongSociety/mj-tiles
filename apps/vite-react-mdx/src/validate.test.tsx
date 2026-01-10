import { test, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import { TileProvider } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import App from './App.mdx'

test('Vite React MDX snapshot', () => {
  const html = renderToString(
    <TileProvider assets={defaultAssets}>
      <App />
    </TileProvider>
  )
  expect(html).toMatchSnapshot()
})
