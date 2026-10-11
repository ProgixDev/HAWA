import {coalescedSync, createSerializer} from '../serializedSync';

// Ordering primitives behind the reminder syncs (Phase 2: F7, cancellation races).

const deferred = <T = void>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
};

describe('createSerializer', () => {
  it('runs tasks one at a time, in the order requested, even when an earlier one is slow', async () => {
    const run = createSerializer();
    const log: string[] = [];
    const slow = deferred();

    const first = run(async () => {
      log.push('first:start');
      await slow.promise;
      log.push('first:end');
    });
    const second = run(async () => {
      log.push('second:start');
    });
    await Promise.resolve();
    expect(log).toEqual(['first:start']); // the second has not started

    slow.resolve();
    await Promise.all([first, second]);
    expect(log).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('a failed task does not block the ones behind it, and still rejects for its own caller', async () => {
    const run = createSerializer();
    const failing = run(async () => {
      throw new Error('boom');
    });
    const after = run(async () => 'ok');

    await expect(failing).rejects.toThrow('boom');
    await expect(after).resolves.toBe('ok');
  });

  it('returns each task\'s own value', async () => {
    const run = createSerializer();
    await expect(Promise.all([run(async () => 1), run(async () => 2)])).resolves.toEqual([1, 2]);
  });
});

describe('coalescedSync', () => {
  it('runs immediately when idle', async () => {
    const task = jest.fn(async () => undefined);
    const sync = coalescedSync(task);

    await sync();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('never overlaps two runs, and a burst of calls during a run shares ONE follow-up run', async () => {
    const gates = [deferred(), deferred(), deferred()];
    let active = 0;
    let maxActive = 0;
    let runs = 0;
    const task = jest.fn(async () => {
      const gate = gates[runs];
      runs += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate.promise;
      active -= 1;
    });
    const sync = coalescedSync(task);

    const a = sync(); // starts run 1
    const b = sync(); // queued
    const c = sync(); // shares b's follow-up
    const d = sync();
    expect(task).toHaveBeenCalledTimes(1);

    gates[0].resolve();
    await a;
    await Promise.resolve();
    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(2); // ONE follow-up for b, c and d
    gates[1].resolve();
    await Promise.all([b, c, d]);

    expect(task).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
  });

  it('a call made DURING a run is served by a run that started AFTER it (it sees the newest state)', async () => {
    let state = 'old';
    const seen: string[] = [];
    const gate = deferred();
    let first = true;
    const sync = coalescedSync(async () => {
      seen.push(state); // reads state at the START of the run, like every objective's sync
      if (first) {
        first = false;
        await gate.promise;
      }
    });

    const early = sync();
    state = 'new'; // the person changes a setting while the first run is still busy
    const late = sync();
    gate.resolve();
    await Promise.all([early, late]);

    expect(seen).toEqual(['old', 'new']);
  });

  it('a rejected run rejects its callers but the next call starts a fresh run', async () => {
    let calls = 0;
    const sync = coalescedSync(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('first run failed');
      }
    });

    await expect(sync()).rejects.toThrow('first run failed');
    await expect(sync()).resolves.toBeUndefined();
    expect(calls).toBe(2);
  });
});
