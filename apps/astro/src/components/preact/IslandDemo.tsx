import { useState } from 'preact/hooks'
import { createRenderer } from 'mj-tiles/core'
import { defaultAssets } from 'mj-tiles/assets'

interface Props {
  hands: string[]
}

const renderer = createRenderer({ assets: defaultAssets })
const renderHand = (hand: string) => renderer.handExtended?.(hand) ?? renderer.hand(hand)

// Preact 版はフレームワーク非依存の core を直接使う
export default function IslandDemo({ hands }: Props) {
  const [index, setIndex] = useState(0)

  return (
    <div class="island-demo">
      <div
        class="island-stage grid-paper-sm mj-scope"
        dangerouslySetInnerHTML={{ __html: renderHand(hands[index]) }}
      />
      <div class="island-foot">
        <code>{hands[index]}</code>
        <button type="button" onClick={() => setIndex((index + 1) % hands.length)}>
          <span class="sym">↺</span>
          <span class="jp">次の例</span><span class="en-only">Next example</span>
        </button>
      </div>
    </div>
  )
}
