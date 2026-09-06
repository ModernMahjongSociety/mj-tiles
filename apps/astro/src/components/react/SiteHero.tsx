import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Tiles } from 'mj-tiles/react'
import { parseHandExtended, type Hand } from 'mj-tiles/core'

const PRESETS = [
  { tag: '3飜', name: '立直平和', hand: '234m345p66778s 東東東' },
  { tag: '役満', name: '国士無双', hand: '19m19p19s東南西北白發中中' },
  { tag: '役満', name: '九蓮宝燈', hand: '1112345678999m 東東' },
  { tag: '役満', name: '大三元', hand: '234m88p 白白白 發發發 中中中' },
  { tag: '2飜', name: '七対子', hand: '11m33p55p77s99s東東發發' },
  { tag: '赤3', name: 'タンヤオ+赤', hand: '234m234p234s r5mr5pr5s 77p' },
  { tag: '副露', name: '鳴き+加槓', hand: '1111+m 2-34p 55-5=0p 東東' },
  { tag: 'Sample', name: '字牌ミックス', hand: '123m789s 東南西北 白發中' },
]

const RANDOM_HANDS = [
  '234m345p66778s 東東東',
  '1112345678999m 東東',
  '19m19p19s東南西北白發中中',
  '234m88p 白白白 發發發 中中中',
  '11m33p55p77s99s東東發發',
  '234m234p234s r5mr5pr5s 77p',
  '1111+m 2-34p 55-5=0p 東東',
  '123m 4-56p 789s 白白白 中',
  '0m0p0s r5mr5pr5s 東東',
  '234567m 234567p 44s',
]

const TILE_ASPECT = 90 / 66
const TILE_GAP = 2
const GROUP_GAP = 8
const MIN_WIDTH = 26
const MAX_WIDTH = 58

// 牌1枚が占める横幅を「立て牌の幅」を1とした比で数える。
// 横向き牌の幅は立て牌の高さと等しいので、縦横比のぶんだけ広い
function countCells(hand: Hand): { cells: number; gap: number } {
  const cellOf = (tile: { isRotated?: boolean }) => (tile.isRotated ? TILE_ASPECT : 1)
  const groups = [hand.concealed, ...hand.melds.map(meld => meld.tiles)].filter(group => group.length > 0)
  const cells = groups.reduce((sum, group) => sum + group.reduce((inner, tile) => inner + cellOf(tile), 0), 0)
  const tileGaps = groups.reduce((sum, group) => sum + (group.length - 1), 0)
  // 門前牌と副露のまとまりの間、および副露どうしの間は --mj-hand-gap
  const groupGaps = Math.max(groups.length - 1, 0)
  return { cells, gap: tileGaps * TILE_GAP + groupGaps * GROUP_GAP }
}

export function fitTileWidth(notation: string, availableWidth: number): number {
  let parsed: Hand
  try {
    parsed = parseHandExtended(notation)
  } catch {
    return MAX_WIDTH
  }
  const { cells, gap } = countCells(parsed)
  if (cells <= 0) return MAX_WIDTH
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor((availableWidth - gap) / cells)))
}

export default function SiteHero() {
  const [notation, setNotation] = useState(PRESETS[0].hand)
  const [tileWidth, setTileWidth] = useState(38)
  const [copied, setCopied] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const refit = useCallback((value: string) => {
    const body = bodyRef.current
    if (!body) return
    // padding 分を差し引いた実効幅。描画が潰れないよう下限を置く
    setTileWidth(fitTileWidth(value, Math.max(body.clientWidth - 40, 200)))
  }, [])

  // SSR では要素幅が測れないため、初回のフィットもマウント後に行う
  useEffect(() => {
    refit(notation)
  }, [notation, refit])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => refit(notation), 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [notation, refit])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notation)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // クリップボードを拒否された場合はラベルを変えない
    }
  }

  return (
    <div className="hero-grid">
      <div>
        <div className="eyebrow">
          <span>Open source · MIT</span>
          <span className="sep" />
          <span>Modern Mahjong Society</span>
        </div>
        <h1 className="h1">
          <span className="jp">
            麻雀の手牌を、<mark>JSX</mark> で。<br />ブラウザに、そのまま並ぶ。
          </span>
          <span className="en-only">
            Draw mahjong hands from <mark>JSX</mark>. In the browser.
          </span>
        </h1>
        <p className="lede">
          <span className="jp">React・Hono・Astro のためのマルチフレームワーク対応ライブラリ。サーバー不要、画像不要、依存ゼロ。ただ短い記法を書くだけ。</span>
          <span className="en-only">A multi-framework library for rendering mahjong hands. No server, no images, no dependencies. Just a short notation string.</span>
          <span className="en jp">A multi-framework mahjong tile renderer. No server, no images, no dependencies.</span>
        </p>
        <div className="hero-cta">
          <a href="#quickstart" className="btn-primary">
            <span className="jp">Quick Start を読む →</span>
            <span className="en-only">Read Quick Start →</span>
          </a>
          <a href="#playground" className="btn-secondary">
            <span className="jp">Playground を開く</span>
            <span className="en-only">Open playground</span>
          </a>
        </div>

        <div className="presets-block">
          <div className="num-label">Presets · try one</div>
          <div className="presets">
            {PRESETS.map(preset => (
              <button
                key={preset.hand}
                type="button"
                className={preset.hand === notation ? 'preset-btn on' : 'preset-btn'}
                onClick={() => setNotation(preset.hand)}
              >
                <span className="tag">{preset.tag}</span>
                <span className="name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="preview-frame">
          <div className="preview-hdr">
            <span className="live"><span className="dot" />LIVE PREVIEW</span>
            <span>RENDER ENGINE · WEBP</span>
          </div>
          <div
            className="preview-body grid-paper mj-scope"
            ref={bodyRef}
            style={{ '--mj-tile-width': `${tileWidth}px` } as CSSProperties}
          >
            {notation.trim()
              ? <Tiles hand={notation} />
              : <span className="empty">Type a hand notation…</span>}
          </div>
          <label className="input-row">
            <span className="label">Hand</span>
            <input
              id="hero-hand"
              type="text"
              value={notation}
              spellCheck={false}
              autoComplete="off"
              placeholder="Type a hand notation…"
              onChange={event => setNotation(event.target.value)}
            />
          </label>
          <div className="action-row">
            <button type="button" className="action-btn" onClick={copy}>
              <span className="sym">⎘</span>
              {copied
                ? <span>Copied!</span>
                : <><span className="jp">記法をコピー</span><span className="en-only">Copy notation</span></>}
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={() => setNotation(RANDOM_HANDS[Math.floor(Math.random() * RANDOM_HANDS.length)])}
            >
              <span className="sym">↺</span>
              <span className="jp">ランダム</span><span className="en-only">Random hand</span>
            </button>
            <a className="action-btn" href="#playground">
              <span className="sym">→</span>
              <span className="jp">Playground で開く</span><span className="en-only">Open in playground</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
