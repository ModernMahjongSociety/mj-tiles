import { Hono } from 'hono'
import { TileProvider, Tile, Tiles, createTileConfig } from 'mj-tiles/hono'
import { defaultAssets } from 'mj-tiles/assets'

const app = new Hono()

app.get('/', (c) => {
  const renderer = createTileConfig({
    assets: defaultAssets,
    styling: "inline"
  })

  return c.html(
    <TileProvider value={renderer}>
      <html>
        <head><title>Hono JSX Test (Inline Styling)</title></head>
        <body>
          <h1>Hono JSX Tiles</h1>
          <Tile tile="1m" />
          <Tiles hand="123m456p789s東南西" />
          <Tile tile="invalid" />
        </body>
      </html>
    </TileProvider>
  )
})

// Export app instance for testing
export { app }

export default {
  port: 3000,
  fetch: app.fetch,
}
