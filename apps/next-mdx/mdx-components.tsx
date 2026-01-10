import type { MDXComponents } from 'mdx/types'
import { Tile, Tiles } from 'mj-tiles/react'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { Tile, Tiles, ...components }
}
