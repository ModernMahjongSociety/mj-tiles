import { createRenderer } from 'mj-tiles/core'
import { defaultAssets } from 'mj-tiles/assets'

const renderer = createRenderer({ assets: defaultAssets })

export default function TilesDemo() {
  const tileHtml = renderer.renderTile('1m')
  const tilesHtml = renderer.renderHand('123m456p789s東南西')

  return (
    <div>
      <h2>Preact Island in Astro</h2>
      <span dangerouslySetInnerHTML={{ __html: tileHtml }} />
      <span dangerouslySetInnerHTML={{ __html: tilesHtml }} />
    </div>
  )
}
