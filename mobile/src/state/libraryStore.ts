import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingStatus = 'not_started' | 'reading' | 'paused' | 'finished';

export type ReadingProgressEntry = {
  percent: number;
  updatedAt: number;
  // Added for the per-article reading timer/controls. Optional so entries
  // persisted by older app versions (percent + updatedAt only) keep loading
  // correctly — every reader falls back to sensible defaults below.
  readingStatus?: ReadingStatus;
  elapsedSeconds?: number;
  lastScrollPosition?: number;
};

export type LibraryState = {
  bookmarks: string[];
  progress: Record<string, ReadingProgressEntry>;
};

const STORAGE_KEY = '@hawa/library/state/v1';

const DEFAULT_STATE: LibraryState = {bookmarks: [], progress: {}};

let cachedState: LibraryState = {bookmarks: [], progress: {}};
let hydrated = false;
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach(listener => listener());

const persist = (): void => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState)).catch(() => {});
};

export async function loadLibraryState(): Promise<LibraryState> {
  if (hydrated) {return getCachedLibraryState();}
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LibraryState>;
      cachedState = {
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
        progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      };
    }
  } catch {
    cachedState = {...DEFAULT_STATE};
  }
  hydrated = true;
  return getCachedLibraryState();
}

export function getCachedLibraryState(): LibraryState {
  return {bookmarks: [...cachedState.bookmarks], progress: {...cachedState.progress}};
}

export function subscribeLibraryState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
}

export function isArticleBookmarked(articleId: string): boolean {
  return cachedState.bookmarks.includes(articleId);
}

export function toggleBookmark(articleId: string): boolean {
  const isBookmarked = cachedState.bookmarks.includes(articleId);
  cachedState = {
    ...cachedState,
    bookmarks: isBookmarked
      ? cachedState.bookmarks.filter(id => id !== articleId)
      : [...cachedState.bookmarks, articleId],
  };
  persist();
  notify();
  return !isBookmarked;
}

export function getReadingProgress(articleId: string): ReadingProgressEntry | undefined {
  return cachedState.progress[articleId];
}

export function setReadingProgress(articleId: string, percent: number, updatedAt: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const existing = cachedState.progress[articleId];
  if (existing && clamped <= existing.percent) {
    cachedState = {...cachedState, progress: {...cachedState.progress, [articleId]: {...existing, updatedAt}}};
  } else {
    cachedState = {...cachedState, progress: {...cachedState.progress, [articleId]: {percent: clamped, updatedAt}}};
  }
  persist();
  notify();
}

export function getRecentlyReadArticleIds(limit = 10): string[] {
  return Object.entries(cachedState.progress)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map(([id]) => id);
}

export type ReadingSessionState = {
  readingStatus: ReadingStatus;
  elapsedSeconds: number;
  lastScrollPosition: number;
};

export function getReadingSessionState(articleId: string): ReadingSessionState {
  const entry = cachedState.progress[articleId];
  return {
    readingStatus: entry?.readingStatus ?? 'not_started',
    elapsedSeconds: entry?.elapsedSeconds ?? 0,
    lastScrollPosition: entry?.lastScrollPosition ?? 0,
  };
}

// Updates only the timer-related fields of a reading session, leaving
// `percent` untouched — callers that also need to bump `percent` (to keep it
// in sync with the rest of the library's "already read" / recommendation
// logic) should call setReadingProgress alongside this, as
// useArticleReadingProgress does.
export function setReadingSessionMeta(
  articleId: string,
  patch: {readingStatus?: ReadingStatus; elapsedSeconds?: number},
): void {
  const existing = cachedState.progress[articleId];
  const next: ReadingProgressEntry = {
    percent: existing?.percent ?? 0,
    updatedAt: Date.now(),
    readingStatus: patch.readingStatus ?? existing?.readingStatus ?? 'not_started',
    elapsedSeconds: patch.elapsedSeconds ?? existing?.elapsedSeconds ?? 0,
    lastScrollPosition: existing?.lastScrollPosition ?? 0,
  };
  cachedState = {...cachedState, progress: {...cachedState.progress, [articleId]: next}};
  persist();
  notify();
}

// Scroll offset updates fire far more often than a UI re-render should ever
// need to react to, so this deliberately skips notify() — readers pull the
// saved position on demand (e.g. when "Reprendre la lecture" is pressed)
// rather than subscribing to it live.
export function saveScrollPosition(articleId: string, y: number): void {
  const existing = cachedState.progress[articleId];
  const next: ReadingProgressEntry = {
    percent: existing?.percent ?? 0,
    updatedAt: existing?.updatedAt ?? Date.now(),
    readingStatus: existing?.readingStatus ?? 'not_started',
    elapsedSeconds: existing?.elapsedSeconds ?? 0,
    lastScrollPosition: Math.max(0, Math.round(y)),
  };
  cachedState = {...cachedState, progress: {...cachedState.progress, [articleId]: next}};
  persist();
}
