import { test, expect } from 'bun:test'
import { fitTileWidth } from './SiteHero'

const HAND = '234m345p66778s 東東東'

test('パネルに収まる最大の牌幅を返す', () => {
  // 14枚 + 牌間 2px * 13 = 26px を差し引いた幅を等分する
  expect(fitTileWidth(HAND, 14 * 30 + 26)).toBe(30)
})

test('広いパネルでも上限を超えない', () => {
  expect(fitTileWidth(HAND, 4000)).toBe(58)
})

test('狭いパネルでも下限を下回らない', () => {
  expect(fitTileWidth(HAND, 100)).toBe(26)
})

test('横向き牌は立て牌より幅を取る', () => {
  // 同じ枚数でも副露があるぶん牌は小さくなる
  expect(fitTileWidth('123m 4-56p 789s 白白白 中', 600)).toBeLessThan(fitTileWidth('123m456p789s白白白中', 600))
})

test('解析できない記法では上限の幅を返す', () => {
  expect(fitTileWidth('!!!', 600)).toBe(58)
})
