import { test, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Astro island の動的ハッシュを正規化
function normalizeAstroHtml(html: string): string {
  return html
    // astro-island の uid を正規化
    .replace(/uid="[^"]+"/g, 'uid="[uid]"')
    // prefix 属性を正規化
    .replace(/prefix="[^"]+"/g, 'prefix="[prefix]"')
    // _astro/ 配下のファイルハッシュを正規化（component-url, href, src など全て）
    .replace(/(\/_astro\/\w+)\.[A-Za-z0-9_-]+\.js/g, '$1.[hash].js')
}

test('Astro basic snapshot', async () => {
  const html = await readFile(join(__dirname, '../dist/basic/index.html'), 'utf-8')
  expect(html).toMatchSnapshot()
})

test('Astro MDX snapshot', async () => {
  const html = await readFile(join(__dirname, '../dist/mdx/index.html'), 'utf-8')
  expect(html).toMatchSnapshot()
})

test('Astro React snapshot', async () => {
  const html = await readFile(join(__dirname, '../dist/react/index.html'), 'utf-8')
  expect(normalizeAstroHtml(html)).toMatchSnapshot()
})

test('Astro Preact snapshot', async () => {
  const html = await readFile(join(__dirname, '../dist/preact/index.html'), 'utf-8')
  expect(normalizeAstroHtml(html)).toMatchSnapshot()
})
