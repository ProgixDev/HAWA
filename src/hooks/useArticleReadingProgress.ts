import {useCallback, useEffect, useRef, useState} from 'react';

import {
  getReadingSessionState,
  loadLibraryState,
  setReadingProgress,
  setReadingSessionMeta,
  type ReadingStatus,
} from '../state/libraryStore';

export type {ReadingStatus};

type UseArticleReadingProgressArgs = {
  articleId: string;
  durationMinutes: number;
};

type UseArticleReadingProgressResult = {
  status: ReadingStatus;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercent: number;
  totalSeconds: number;
  start: () => void;
  pause: () => void;
};

// Owns the single source of truth for one article's reading timer: hydrates
// from the persisted session on mount, runs exactly one setInterval while
// `status === 'reading'`, and mirrors every tick back to libraryStore so
// progress survives navigating away or closing the app. Mount this once per
// article screen (ReadingControls does that for you) — mounting it twice for
// the same articleId would run two independent intervals.
export function useArticleReadingProgress({
  articleId,
  durationMinutes,
}: UseArticleReadingProgressArgs): UseArticleReadingProgressResult {
  const totalSeconds = Math.max(1, Math.round(durationMinutes * 60));
  const [status, setStatus] = useState<ReadingStatus>('not_started');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const hydratedArticleIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    hydratedArticleIdRef.current = null;
    loadLibraryState().then(() => {
      if (!mounted) {return;}
      const session = getReadingSessionState(articleId);
      const clampedElapsed = Math.min(session.elapsedSeconds, totalSeconds);
      let restoredStatus = session.readingStatus;

      // A session left in "reading" was mid-playback when the user
      // navigated away or the app was closed — never resume automatically.
      if (restoredStatus === 'reading') {
        restoredStatus = 'paused';
        setReadingSessionMeta(articleId, {readingStatus: 'paused', elapsedSeconds: clampedElapsed});
      }
      if (clampedElapsed >= totalSeconds && restoredStatus === 'not_started') {
        restoredStatus = 'finished';
      }

      hydratedArticleIdRef.current = articleId;
      setStatus(restoredStatus);
      setElapsedSeconds(clampedElapsed);
    });
    return () => {mounted = false;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  useEffect(() => {
    if (status !== 'reading') {return;}
    const interval = setInterval(() => {
      setElapsedSeconds(current => {
        const next = Math.min(totalSeconds, current + 1);
        const percent = Math.min(100, (next / totalSeconds) * 100);
        setReadingProgress(articleId, percent, Date.now());
        if (next >= totalSeconds) {
          setReadingSessionMeta(articleId, {readingStatus: 'finished', elapsedSeconds: next});
          setStatus('finished');
        } else {
          setReadingSessionMeta(articleId, {readingStatus: 'reading', elapsedSeconds: next});
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, articleId, totalSeconds]);

  const start = useCallback(() => {
    if (status === 'finished') {return;}
    setStatus('reading');
    setReadingSessionMeta(articleId, {readingStatus: 'reading'});
  }, [articleId, status]);

  const pause = useCallback(() => {
    if (status !== 'reading') {return;}
    setStatus('paused');
    setReadingSessionMeta(articleId, {readingStatus: 'paused'});
  }, [articleId, status]);

  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

  return {status, elapsedSeconds, remainingSeconds, progressPercent, totalSeconds, start, pause};
}
