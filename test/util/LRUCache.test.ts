import { LRUCache } from '../../src';

describe('The LRUCache', () => {
  it('should cache parsed documents', async () => {
    const cache = new LRUCache<number, number>(3);
    expect(cache.size()).toEqual(0);
    expect(cache.get(0)).toBeUndefined();

    cache.set(0, 0);
    expect(cache.get(0)).toEqual(0);
    expect(cache.size()).toEqual(1);

    cache.set(0, 1);
    expect(cache.get(0)).toEqual(1);
    expect(cache.size()).toEqual(1);

    cache.set(1, 1);
    expect(cache.get(1)).toEqual(1);
    expect(cache.size()).toEqual(2);

    cache.get(0);
    cache.set(2, 2);
    cache.set(3, 3);

    expect(cache.get(1)).toBeUndefined();
    expect(cache.size()).toEqual(3);
  });
});
