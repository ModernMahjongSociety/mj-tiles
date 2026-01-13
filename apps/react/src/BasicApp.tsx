import { Tile, Tiles } from 'mj-tiles/react'

export default function BasicApp() {
  return (
    <div>
      <h1>React Basic Tiles</h1>

      <h2>通常の牌</h2>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />

      <h2>裏面（黄色の縞模様）</h2>
      <Tiles hand="o1m o1m o1m" />

      <h2>副露の例（暗槓で裏面使用）</h2>
      <Tiles hand="123m [o1po1po1po1p]" />
    </div>
  )
}
