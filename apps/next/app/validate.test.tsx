import { test, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Normalize Next.js HTML output for stable snapshot testing.
 * Next.js generates content-hashed chunk filenames that change between builds,
 * so we replace these with stable placeholders.
 */
function normalizeNextHtml(html: string): string {
  return html
    // Normalize chunk filenames: 161-8100e0ea7d1493cf.js -> 161-[hash].js
    .replace(/(\d+)-[a-f0-9]{16}\.js/g, '$1-[hash].js')
    // Normalize named chunks: page-[hash].js, layout-[hash].js, main-app-[hash].js
    .replace(/(page|layout|main-app)-[a-f0-9]{16}\.js/g, '$1-[hash].js')
}

test('Next.js MDX snapshot', async () => {
  const html = await readFile(join(__dirname, '../out/index.html'), 'utf-8')
  const normalizedHtml = normalizeNextHtml(html)
  expect(normalizedHtml).toMatchSnapshot()
})
