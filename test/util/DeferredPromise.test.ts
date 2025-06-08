import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DeferredPromise } from '../../src';

describe('A DeferredPromise', () => {
  it('should be resolvable externally immediately', async () => {
    const deferred = new DeferredPromise<string>();

    deferred.resolve('test');

    assert.deepStrictEqual(await deferred, 'test');
  });

  it('should be resolvable externally later', async () => {
    const deferred = new DeferredPromise<string>();

    setTimeout(() => deferred.resolve('test'), 100);

    assert.deepStrictEqual(await deferred, 'test');
  });
});
