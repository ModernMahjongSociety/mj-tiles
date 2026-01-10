import React from 'react'
import ReactDOM from 'react-dom/client'
import { TileProvider } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import App from './App.mdx'
import 'mj-tiles/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TileProvider config={{ assets: defaultAssets }}>
      <App />
    </TileProvider>
  </React.StrictMode>
)
