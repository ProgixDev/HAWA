import type {StyleSpecification} from '@maplibre/maplibre-react-native';

import {MAP_STYLE_URL} from '../../config/maps';

type StyleSource = {
  type?: string;
  url?: string;
  tiles?: string[];
  data?: unknown;
};

type RawStyle = StyleSpecification & {
  sources: Record<string, StyleSource>;
};

const hasSourceData = (source: StyleSource) => {
  if (source.type !== 'vector' && source.type !== 'raster') {
    return true;
  }
  return Boolean(source.url || source.tiles?.length || source.data);
};

/**
 * MapTiler currently includes a metadata-only vector source used to carry an
 * attribution string. MapLibre Native requires every vector/raster source to
 * expose `url` or `tiles`, so remove metadata-only sources before parsing.
 */
export async function loadMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL);
  if (!response.ok) {
    throw new Error('MAP_STYLE_UNAVAILABLE');
  }

  const style = (await response.json()) as RawStyle;
  const validSources = Object.fromEntries(
    Object.entries(style.sources).filter(([, source]) => hasSourceData(source)),
  );

  return {...style, sources: validSources} as StyleSpecification;
}

