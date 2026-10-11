// Ordering for reminder synchronisation.
//
// Every objective re-derives its reminders from stored state and hands them to the native scheduler. Those runs are
// triggered from many places (app start, a setting changing, a profile switch, returning to the foreground, a
// language change) and used to overlap: an older run, still working from older state, could finish AFTER a newer
// one and put back a reminder the person had just switched off.
//
// Two small tools, both strict about ORDER and neither about speed:
//   createSerializer()   — runs the tasks it is given one after another, in the order they were requested. For
//                          operations that carry arguments (cancel THIS profile, sync with `force`).
//   coalescedSync(task)  — for an idempotent "re-derive everything from current state" function: while one run is in
//                          progress, any number of further calls share ONE follow-up run that starts afterwards and
//                          therefore sees the newest state. Every caller's promise settles only after a run that
//                          started after its call.

/** Runs tasks strictly one after another; a failed task never blocks the ones queued behind it. */
export function createSerializer(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

/**
 * Wraps an idempotent sync so that concurrent calls cannot overlap and a burst collapses into at most one extra
 * run. The returned promise rejects when the run that served it rejected.
 */
export function coalescedSync(task: () => Promise<void>): () => Promise<void> {
  let running: Promise<void> | null = null;
  let queued: Promise<void> | null = null;

  const start = (): Promise<void> => {
    const current = task().finally(() => {
      if (running === current) {
        running = null;
      }
    });
    running = current;
    return current;
  };

  return () => {
    if (queued) {
      return queued;
    }
    if (!running) {
      return start();
    }
    queued = running
      .catch(() => undefined)
      .then(() => {
        queued = null;
        return start();
      });
    return queued;
  };
}
