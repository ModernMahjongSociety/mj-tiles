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
  // 拡張記法をサポート（副露、裏面など）
  return raw(renderer.handExtended ? renderer.handExtended(hand) : renderer.hand(hand));
};
