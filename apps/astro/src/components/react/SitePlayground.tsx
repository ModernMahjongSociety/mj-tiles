import { useState, type CSSProperties } from 'react'
import { Tiles } from 'mj-tiles/react'

const PRESETS = [
  { label: '通常', hand: '123m456p789s東東東' },
  { label: '九蓮', hand: '1112345678999m 東東' },
  { label: '国士', hand: '19m19p19s東南西北白發中中' },
  { label: '大三元', hand: '234m88p 白白白 發發發 中中中' },
  { label: '全鳴き', hand: '1111+m 2-34p 55-5=0p 7z' },
  { label: '赤ドラ', hand: '0m0p0s r5mr5pr5s' },
  { label: '七対子', hand: '11223344556677m' },
]

export default function SitePlayground() {
  const [notation, setNotation] = useState(PRESETS[1].hand)
  const [tileWidth, setTileWidth] = useState(52)

  const copy = async () => {
    try {
      // 非セキュアな接続では navigator.clipboard 自体が無く、同期に throw する
      await navigator.clipboard.writeText(notation)
    } catch {
      // クリップボードを使えない環境では何もしない
    }
  }

  return (
    <div className="pg-frame">
      <div className="pg-hdr">
        <span className="live"><span className="dot" />LIVE PLAYGROUND</span>
        <span>PARSER · parseHandExtended()</span>
      </div>
      <div className="pg-body">
        <div className="pg-in">
          <label className="lbl" htmlFor="pg-input">Hand notation</label>
          <textarea
            id="pg-input"
            spellCheck={false}
            autoComplete="off"
            value={notation}
            onChange={event => setNotation(event.target.value)}
          />
          <div className="presets-mini">
            {PRESETS.map(preset => (
              <button key={preset.hand} type="button" onClick={() => setNotation(preset.hand)}>
                {preset.label}
              </button>
            ))}
          </div>
          <div className="size-ctl">
            <label htmlFor="pg-size">Size</label>
            <input
              id="pg-size"
              type="range"
              min={24}
              max={80}
              value={tileWidth}
              onChange={event => setTileWidth(Number(event.target.value))}
            />
            <span className="val">{tileWidth}px</span>
          </div>
        </div>
        <div
          className="pg-out grid-paper mj-scope"
          style={{ '--mj-tile-width': `${tileWidth}px` } as CSSProperties}
        >
          {notation.trim() ? <Tiles hand={notation} /> : <span className="empty">Type a hand notation…</span>}
        </div>
      </div>
      <div className="pg-actions">
        <button type="button" onClick={copy}>
          <span className="sym">⎘</span>
          <span className="jp">記法をコピー</span><span className="en-only">Copy notation</span>
        </button>
        <button type="button" onClick={() => setNotation('')}>
          <span className="sym">×</span>
          <span className="jp">クリア</span><span className="en-only">Clear</span>
        </button>
        <a href="#quickstart">
          <span className="sym">→</span>
          <span className="jp">Quick Start へ</span><span className="en-only">Go to Quick Start</span>
        </a>
      </div>
    </div>
  )
}
