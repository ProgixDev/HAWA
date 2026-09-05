import type {ArticleLevel, ArticleType} from '../data/libraryContent';

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
