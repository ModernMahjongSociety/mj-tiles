import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

const defaultRenderer = createRenderer({ assets: defaultAssets });
const TileContext = createContext<TileRenderer>(defaultRenderer);

export interface TileProviderProps {
  config?: Partial<RendererConfig>;
  children: ReactNode;
}

export function TileProvider({ config, children }: TileProviderProps) {
  const renderer = useMemo(
    () =>
      createRenderer({
        assets: config?.assets ?? defaultAssets,
        mode: config?.mode,
        class: config?.class,
      }),
    [config],
  );

  return (
    <TileContext.Provider value={renderer}>{children}</TileContext.Provider>
  );
}

export function useTileRenderer(): TileRenderer {
  return useContext(TileContext);
}
