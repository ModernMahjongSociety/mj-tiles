import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { useTileRenderer } from "./context";

interface TileProps {
  tile: string;
}

export const Tile: FC<TileProps> = ({ tile }) => {
  const renderer = useTileRenderer();
  return raw(renderer.tile(tile));
};

interface TilesProps {
  hand: string;
}

export const Tiles: FC<TilesProps> = ({ hand }) => {
  const renderer = useTileRenderer();
  return raw(renderer.hand(hand));
};
