type TtlEntry = { value: string; expiry: number | null };

export class RedisFallback {
  private store = new Map<string, TtlEntry>();
  private listStore = new Map<string, string[]>();

  private cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiry !== null && now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async get(key: string): Promise<string | null> {
    this.cleanExpired();
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    if (mode === 'EX' && ttl) {
      this.store.set(key, { value, expiry: Date.now() + ttl * 1000 });
    } else if (mode === 'KEEPTTL') {
      const existing = this.store.get(key);
      this.store.set(key, { value, expiry: existing?.expiry ?? null });
    } else {
      this.store.set(key, { value, expiry: null });
    }
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
      if (this.listStore.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    this.cleanExpired();
    const existing = this.store.get(key);
    if (!existing) {
      this.store.set(key, { value: '1', expiry: null });
      return 1;
    }
    const next = parseInt(existing.value, 10) + 1;
    this.store.set(key, { value: String(next), expiry: existing.expiry });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiry === null) return -1;
    const remaining = Math.ceil((entry.expiry - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  async rpush(key: string, value: string): Promise<number> {
    const list = this.listStore.get(key) || [];
    list.push(value);
    this.listStore.set(key, list);
    return list.length;
  }

  async llen(key: string): Promise<number> {
    return this.listStore.get(key)?.length || 0;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.listStore.get(key) || [];
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  }

  async blpop(key: string, timeout: number): Promise<[string, string] | null> {
    const deadline = Date.now() + timeout * 1000;
    while (Date.now() < deadline) {
      const list = this.listStore.get(key);
      if (list && list.length > 0) {
        const value = list.shift()!;
        if (list.length === 0) this.listStore.delete(key);
        return [key, value];
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  on(_event: string, _handler: (...args: unknown[]) => void): void {
    // no-op
  }
}
