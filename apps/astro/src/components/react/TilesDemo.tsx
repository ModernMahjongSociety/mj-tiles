import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'

export default function TilesDemo() {
  return (
    <TileProvider config={{ assets: defaultAssets }}>
      <h2>React Island in Astro</h2>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />
    </TileProvider>
  )
}
