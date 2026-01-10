import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import 'mj-tiles/styles.css'

export default function App() {
  return (
    <TileProvider assets={defaultAssets}>
      <h1>React Vite Tiles</h1>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />
    </TileProvider>
  )
}
