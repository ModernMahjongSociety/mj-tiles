'use client'

import { TileProvider } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import 'mj-tiles/styles.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <TileProvider config={{ assets: defaultAssets }}>
          {children}
        </TileProvider>
      </body>
    </html>
  )
}
