export class DeferredPromise<T> implements Promise<T> {
  readonly then: Promise<T>["then"];
  readonly catch: Promise<T>["catch"];
  readonly finally: Promise<T>["finally"];
  readonly [Symbol.toStringTag] = "DeferredPromise";

  protected promise: Promise<T>;
  protected resolvePromise!: (value: T | PromiseLike<T>) => void;
  protected rejectPromise!: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });

    this.then = (...args) => this.promise.then(...args);
    this.catch = (...args) => this.promise.catch(...args);
    this.finally = (...args) => this.promise.finally(...args);
  }

  resolve(value: T | PromiseLike<T>) {
    this.resolvePromise(value);
  }

  reject(reason?: unknown) {
    this.rejectPromise(reason);
  }
}
