import { test, expect } from 'bun:test'
import { app } from './index'

test('Hono JSX snapshot', async () => {
  const res = await app.request('/')
  const html = await res.text()

  expect(html).toMatchSnapshot()
  expect(html).toContain('<img')  // WebP画像を使用
})
