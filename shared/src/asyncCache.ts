/** Bounded, short-lived cache that shares concurrent loads and never caches failures. */
export class AsyncCache<T> {
  private entries = new Map<string, { value: T; expiresAt: number }>();
  private pending = new Map<string, Promise<T>>();
  private generation = 0;

  constructor(private maxEntries = 100, private now = () => Date.now()) {}

  clear() {
    this.generation++;
    this.entries.clear();
    this.pending.clear();
  }

  getOrLoad(key: string, load: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > this.now()) return Promise.resolve(cached.value);
    this.entries.delete(key);
    const pending = this.pending.get(key);
    if (pending) return pending;

    const generation = this.generation;
    const request = Promise.resolve().then(load).then(value => {
      // An edit made during this load must not repopulate the cache with old data.
      if (generation === this.generation) {
        for (const [entryKey, entry] of this.entries) {
          if (entry.expiresAt <= this.now()) this.entries.delete(entryKey);
        }
        if (this.entries.size >= this.maxEntries) {
          this.entries.delete(this.entries.keys().next().value!);
        }
        this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
      }
      return value;
    }).finally(() => {
      if (this.pending.get(key) === request) this.pending.delete(key);
    });
    this.pending.set(key, request);
    return request;
  }
}
