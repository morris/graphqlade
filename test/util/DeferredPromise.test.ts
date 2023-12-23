import { DeferredPromise } from '../../src';

describe('A DeferredPromise', () => {
  it('should be resolvable externally immediately', async () => {
    const deferred = new DeferredPromise<string>();

    deferred.resolve('test');

    expect(await deferred).toEqual('test');
  });

  it('should be resolvable externally later', async () => {
    const deferred = new DeferredPromise<string>();

    setTimeout(() => deferred.resolve('test'), 100);

    expect(await deferred).toEqual('test');
  });
});
