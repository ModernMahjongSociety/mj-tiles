import { test, expect } from 'bun:test'
import { renderToString } from 'react-dom/server'
import App from './App'

test('React Vite snapshot', () => {
  const html = renderToString(<App />)
  expect(html).toMatchSnapshot()
})
