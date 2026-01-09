import { useTileRenderer } from "./context";

interface TileProps {
  tile: string;
  className?: string;
}

export function Tile({ tile, className }: TileProps) {
  const renderer = useTileRenderer();
  const html = renderer.tile(tile);

  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

interface TilesProps {
  hand: string;
  className?: string;
}

export function Tiles({ hand, className }: TilesProps) {
  const renderer = useTileRenderer();
  const html = renderer.hand(hand);

  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
