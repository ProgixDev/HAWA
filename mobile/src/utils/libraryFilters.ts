import type {ArticleLevel, ArticleType, TranslateFn} from '../data/libraryContent';

export type ReadingTimeFilter = 'any' | 'short' | 'medium' | 'long';

export type LibraryFilters = {
  readingTime: ReadingTimeFilter;
  levels: ArticleLevel[];
  types: ArticleType[];
  favoritesOnly: boolean;
  alreadyRead: boolean;
  recentlyRead: boolean;
};

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  readingTime: 'any',
  levels: [],
  types: [],
  favoritesOnly: false,
  alreadyRead: false,
  recentlyRead: false,
};

export const READING_TIME_OPTIONS: {key: ReadingTimeFilter; label: string}[] = [
  {key: 'any', label: 'Toutes durées'},
  {key: 'short', label: '< 5 min'},
  {key: 'medium', label: '5–8 min'},
  {key: 'long', label: '9 min +'},
];

export const LEVEL_OPTIONS: {key: ArticleLevel; label: string}[] = [
  {key: 'beginner', label: 'Débutant'},
  {key: 'intermediate', label: 'Intermédiaire'},
  {key: 'advanced', label: 'Avancé'},
];

export const TYPE_OPTIONS: {key: ArticleType; label: string}[] = [
  {key: 'article', label: 'Article'},
  {key: 'guide', label: 'Guide'},
  {key: 'faq', label: 'FAQ'},
];

// Translated variants of the option lists above (see libraryContent.ts's
// TranslateFn for the established pattern). The plain *_OPTIONS constants
// above stay untouched, still French-literal, so LibraryFiltersSheet.tsx
// (out of scope for this phase) keeps compiling and behaving exactly as
// before; wiring it to real translations is a future phase.
export function getReadingTimeOptions(t: TranslateFn): {key: ReadingTimeFilter; label: string}[] {
  return READING_TIME_OPTIONS.map(option => ({...option, label: t(`library.filters.readingTime.${option.key}`)}));
}

export function getLevelOptions(t: TranslateFn): {key: ArticleLevel; label: string}[] {
  return LEVEL_OPTIONS.map(option => ({...option, label: t(`library.filters.level.${option.key}`)}));
}

export function getTypeOptions(t: TranslateFn): {key: ArticleType; label: string}[] {
  return TYPE_OPTIONS.map(option => ({...option, label: t(`library.filters.type.${option.key}`)}));
}

export function matchesReadingTime(durationMinutes: number, filter: ReadingTimeFilter): boolean {
  if (filter === 'any') {return true;}
  if (filter === 'short') {return durationMinutes <= 4;}
  if (filter === 'medium') {return durationMinutes >= 5 && durationMinutes <= 8;}
  return durationMinutes >= 9;
}

export function countActiveFilters(filters: LibraryFilters): number {
  return (
    (filters.readingTime !== 'any' ? 1 : 0) +
    filters.levels.length +
    filters.types.length +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.alreadyRead ? 1 : 0) +
    (filters.recentlyRead ? 1 : 0)
  );
}

export function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}
