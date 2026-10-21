// Brazilian Portuguese ('pt-BR') editorial content = the Portugal text ('pt-PT') with a small overlay of the words and spellings that differ.
//
// AWA ships ONE complete Portuguese translation of every article and pregnancy week (European Portuguese, in the `'pt-PT'` block). Brazil reads
// the same text except where Brazilian Portuguese says something else (Registo → Registro, ecografia → ultrassonografia, equipa → equipe …): those
// strings, and only those, are listed in ptBrEditorialOverlay.ts by their path inside the block. This keeps one source of truth, no duplicated
// articles, and makes every regional difference explicit and reviewable.
import {PT_BR_ARTICLE_OVERLAY, PT_BR_WEEK_OVERLAY} from './ptBrEditorialOverlay';

type Overlay = Readonly<Record<string, string>>;

/** 'a.b[0][1]' → ['a', 'b', 0, 1] */
function segmentsOf(path: string): Array<string | number> {
  const out: Array<string | number> = [];
  for (const part of path.split('.')) {
    const match = part.match(/^([^[]*)((?:\[\d+\])*)$/);
    if (!match) {continue;}
    if (match[1]) {out.push(match[1]);}
    for (const index of match[2].match(/\d+/g) ?? []) {out.push(Number(index));}
  }
  return out;
}

/** A deep copy of `base` in which each overlay path is replaced by its Brazilian string. A path that does not exist in `base` is ignored. */
export function applyPortugueseOverlay<T>(base: T, overlay: Overlay | undefined): T {
  const copy = JSON.parse(JSON.stringify(base)) as T;
  if (!overlay) {
    return copy;
  }
  for (const [path, value] of Object.entries(overlay)) {
    const segments = segmentsOf(path);
    const last = segments.pop();
    let node: unknown = copy;
    for (const segment of segments) {
      node = node && typeof node === 'object' ? (node as Record<string | number, unknown>)[segment] : undefined;
    }
    if (last !== undefined && node && typeof node === 'object' && typeof (node as Record<string | number, unknown>)[last] === 'string') {
      (node as Record<string | number, unknown>)[last] = value;
    }
  }
  return copy;
}

/** Adds the `'pt-BR'` block to one article's per-language CONTENT object: its `'pt-PT'` block with that article's Brazilian overlay applied. */
export function withBrazilianPortuguese<T extends {readonly 'pt-PT': unknown}>(article: string, content: T): T & {readonly 'pt-BR': T['pt-PT']} {
  return {...content, 'pt-BR': applyPortugueseOverlay(content['pt-PT'], PT_BR_ARTICLE_OVERLAY[article])};
}

/** The Brazilian version of one pregnancy week's content (the Portugal content with that week's overlay applied). */
export function brazilianWeekContent<T>(week: number, base: T): T {
  return applyPortugueseOverlay(base, PT_BR_WEEK_OVERLAY[week]);
}
