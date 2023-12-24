export class LRUCache<TKey, TValue> {
  protected cache: Map<
    TKey,
    {
      value: TValue;
      index: number;
    }
  > = new Map();

  protected index = 0;

  constructor(protected maxSize: number) {}

  get(key: TKey) {
    const entry = this.cache.get(key);

    if (entry) {
      entry.index = this.index++;
      return entry.value;
    }

    return undefined;
  }

  set(key: TKey, value: TValue) {
    this.cache.set(key, { value, index: this.index++ });

    if (this.cache.size > this.maxSize) {
      const minIndex = this.index - this.maxSize;

      for (const [key, entry] of this.cache) {
        if (entry.index < minIndex) this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}
