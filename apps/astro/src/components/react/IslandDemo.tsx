import { useState } from 'react'
import { Tiles } from 'mj-tiles/react'

interface Props {
  hands: string[]
}

// React 版はフレームワーク用コンポーネントをそのまま使う
export default function IslandDemo({ hands }: Props) {
  const [index, setIndex] = useState(0)

  return (
    <div className="island-demo">
      <div className="island-stage grid-paper-sm mj-scope">
        <Tiles hand={hands[index]} />
      </div>
      <div className="island-foot">
        <code>{hands[index]}</code>
        <button type="button" onClick={() => setIndex((index + 1) % hands.length)}>
          <span className="sym">↺</span>
          <span className="jp">次の例</span><span className="en-only">Next example</span>
        </button>
      </div>
    </div>
  )
}
