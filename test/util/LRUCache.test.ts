import assert from 'node:assert';
import { describe, it } from 'node:test';
import { LRUCache } from '../../src';

describe('The LRUCache', () => {
  it('should cache parsed documents', async () => {
    const cache = new LRUCache<number, number>(3);
    assert.deepStrictEqual(cache.size(), 0);
    assert.deepStrictEqual(cache.get(0), undefined);

    cache.set(0, 0);
    assert.deepStrictEqual(cache.get(0), 0);
    assert.deepStrictEqual(cache.size(), 1);

    cache.set(0, 1);
    assert.deepStrictEqual(cache.get(0), 1);
    assert.deepStrictEqual(cache.size(), 1);

    cache.set(1, 1);
    assert.deepStrictEqual(cache.get(1), 1);
    assert.deepStrictEqual(cache.size(), 2);

    cache.get(0);
    cache.set(2, 2);
    cache.set(3, 3);

    assert.deepStrictEqual(cache.get(1), undefined);
    assert.deepStrictEqual(cache.size(), 3);
  });
});
