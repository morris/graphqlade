export class DeferredPromise<T> extends Promise<T> {
  protected _resolve: (value: T | PromiseLike<T>) => void;
  protected _reject: (reason?: unknown) => void;

  constructor() {
    super((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    this._resolve = () => {
      throw new Error("Resolved a deferred promise too early");
    };
    this._reject = () => {
      throw new Error("Rejected a deferred promise too early");
    };
  }

  resolve(value: T | PromiseLike<T>) {
    this._resolve(value);
  }

  reject(reason?: unknown) {
    this._reject(reason);
  }
}
