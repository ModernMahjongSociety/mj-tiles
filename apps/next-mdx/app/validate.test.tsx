import { test, expect } from 'bun:test'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

test('Next.js MDX snapshot', async () => {
  const html = await readFile(join(__dirname, '../out/index.html'), 'utf-8')
  expect(html).toMatchSnapshot()
})
