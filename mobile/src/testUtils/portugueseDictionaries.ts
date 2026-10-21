// Test helper: the dictionary a Brazilian user effectively reads = the Brazilian overlay (ptBR.ts) laid over the Portugal dictionary (ptPT.ts),
// which is exactly what i18next's pt-BR → pt-PT → en fallback resolves key by key.
import {ptPT} from '../i18n/locales/ptPT';
import {ptBR} from '../i18n/locales/ptBR';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => value !== null && typeof value === 'object' && !Array.isArray(value);

export function deepMerge(base: unknown, overlay: unknown): unknown {
  if (isObject(base) && isObject(overlay)) {
    const out: Json = {...base};
    for (const [key, value] of Object.entries(overlay)) {
      out[key] = key in base ? deepMerge(base[key], value) : value;
    }
    return out;
  }
  return overlay === undefined ? base : overlay;
}

/** The complete Brazilian-Portuguese dictionary (overlay merged over Portugal). */
export const ptBRFull = deepMerge(ptPT, ptBR) as typeof ptPT;
export {ptPT, ptBR};
