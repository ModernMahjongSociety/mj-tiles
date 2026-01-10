import { test, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'

test('Vite React MDX snapshot', () => {
  // Testing the same content as App.mdx, but rendered directly
  // to avoid Bun's lack of MDX transformation support in tests
  const html = renderToString(
    <TileProvider config={{ assets: defaultAssets }}>
      <div>
        <h1>Vite React MDX Tiles</h1>
        <Tile tile="1m" />
        <Tiles hand="123m456p789s東南西" />
      </div>
    </TileProvider>
  )
  expect(html).toMatchSnapshot()
})
