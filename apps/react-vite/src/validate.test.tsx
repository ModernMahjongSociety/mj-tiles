import { test, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'

test('React Vite snapshot', () => {
  const html = renderToString(
    <TileProvider config={{ assets: defaultAssets }}>
      <h1>React Vite Tiles</h1>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />
    </TileProvider>
  )
  expect(html).toMatchSnapshot()
})
