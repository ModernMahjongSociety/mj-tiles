import React from 'react'
import ReactDOM from 'react-dom/client'
import { TileProvider } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import BasicApp from './BasicApp'
import MdxApp from './MdxApp.mdx'
import 'mj-tiles/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TileProvider config={{ assets: defaultAssets }}>
      <BasicApp />
      <hr />
      <MdxApp />
    </TileProvider>
  </React.StrictMode>
)
