type SubscriptionIteratorInit<T> = (
  push: (value: T) => void,
  stop: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fail: (err: any) => void
) => Promise<() => unknown> | (() => unknown);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SubscriptionIterator<T> implements AsyncIterator<T> {
  protected init: SubscriptionIteratorInit<T>;
  protected initialized = false;
  protected queue: T[] = [];
  protected stopped = false;
  protected _yield?: Promise<void>;
  protected _continue?: () => void;
  protected _cancel?: () => void;
  protected _unsubscribe?: () => void;

  constructor(init: SubscriptionIteratorInit<T>) {
    this.init = init;
  }

  protected async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this._unsubscribe = await this.init(
      (value) => {
        this.queue.push(value);
        this.continue();
      },
      () => this.return(),
      (err) => this.throw(err)
    );
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.stopped) return { done: true, value: undefined };

    await this.initialize();

    if (this.queue.length === 0) {
      try {
        await this.yield();
      } catch (err) {
        // only caused by cancel
        this.stopped = true;
        this.unsubscribe();

        return { done: true, value: undefined };
      }
    }

    if (this.queue.length > 0) {
      const value = this.queue.shift() as T;
      const done = this.stopped && this.queue.length === 1;

      return { done, value };
    } else {
      return this.next();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw(err: any): Promise<IteratorResult<T>> {
    this.stopped = true;
    this.unsubscribe();
    this.cancel();

    return Promise.reject(err);
  }

  async return(): Promise<IteratorResult<T>> {
    this.stopped = true;
    this.unsubscribe();
    this.cancel();

    return { done: true, value: undefined };
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  protected yield() {
    if (!this._yield) {
      this._yield = new Promise<void>((resolve, reject) => {
        this._continue = resolve;
        this._cancel = reject;
      });
    }

    return this._yield;
  }

  protected continue() {
    if (this._continue) this._continue();
    this._continue = undefined;
    this._yield = undefined;
  }

  protected cancel() {
    if (this._cancel) this._cancel();
    this._cancel = undefined;
    this._yield = undefined;
  }

  protected unsubscribe() {
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = undefined;
  }
}
