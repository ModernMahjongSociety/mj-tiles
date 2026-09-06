import { createSignal } from 'solid-js'
import { createRenderer } from 'mj-tiles/core'
import { defaultAssets } from 'mj-tiles/assets'

interface Props {
  hands: string[]
}

const renderer = createRenderer({ assets: defaultAssets })
const renderHand = (hand: string) => renderer.handExtended?.(hand) ?? renderer.hand(hand)

// Solid 版も core を直接使い、innerHTML で描画する
export default function IslandDemo(props: Props) {
  const [index, setIndex] = createSignal(0)
  const hand = () => props.hands[index()]

  return (
    <div class="island-demo">
      <div class="island-stage grid-paper-sm mj-scope" innerHTML={renderHand(hand())} />
      <div class="island-foot">
        <code>{hand()}</code>
        <button type="button" onClick={() => setIndex((index() + 1) % props.hands.length)}>
          <span class="sym">↺</span>
          <span class="jp">次の例</span><span class="en-only">Next example</span>
        </button>
      </div>
    </div>
  )
}
