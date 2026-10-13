/**
 * Per-key sliding-window limiter for the routes that spend money upstream
 * (Deepgram key mints, ElevenLabs audio). In-memory, so each API instance
 * keeps its own window; that is enough to stop one client draining a key.
 */
export interface SlidingWindowLimiter {
  /** Seconds until `key` may make another call; 0 when it may call now. */
  retryAfterSeconds(key: string, now?: number): number;
  /** Counts one call against `key`. */
  record(key: string, now?: number): void;
  /** Exposed for test teardown only. */
  clear(): void;
}

// Above this many tracked keys, every key is pruned on the next record so
// one-off clients don't accumulate forever.
const SWEEP_THRESHOLD = 1000;

export function createSlidingWindowLimiter(options: {
  limit: number;
  windowMs: number;
}): SlidingWindowLimiter {
  const hitsByKey = new Map<string, number[]>();

  const prune = (key: string, now: number): number[] => {
    const hits = (hitsByKey.get(key) ?? []).filter((t) => now - t < options.windowMs);
    if (hits.length === 0) hitsByKey.delete(key);
    else hitsByKey.set(key, hits);
    return hits;
  };

  return {
    retryAfterSeconds(key, now = Date.now()) {
      const hits = prune(key, now);
      if (hits.length < options.limit) return 0;
      // The oldest hit in the window is the next to expire.
      const oldest = hits[hits.length - options.limit] ?? now;
      return Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    },
    record(key, now = Date.now()) {
      if (hitsByKey.size > SWEEP_THRESHOLD) {
        for (const k of [...hitsByKey.keys()]) prune(k, now);
      }
      const hits = prune(key, now);
      hits.push(now);
      hitsByKey.set(key, hits);
    },
    clear() {
      hitsByKey.clear();
    },
  };
}
