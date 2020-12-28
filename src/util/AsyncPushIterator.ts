type AsyncPushIteratorSetup<T> = (
  push: (value: T) => void,
  stop: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fail: (err: any) => void
) => Promise<() => unknown> | (() => unknown);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AsyncPushIterator<T> implements AsyncIterator<T> {
  protected setup: AsyncPushIteratorSetup<T>;
  protected initialized = false;
  protected done = false;
  protected queue: T[] = [];
  protected yielding?: Promise<void>;
  protected continue?: () => void;
  protected cancel?: () => void;
  protected teardown?: () => void;

  constructor(setup: AsyncPushIteratorSetup<T>) {
    this.setup = setup;
  }

  protected async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this.teardown = await this.setup(
      (value) => {
        if (!this.done) this.queue.push(value);

        this.maybeContinue();
      },
      () => this.return(),
      (err) => this.throw(err)
    );
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.done) return { done: true, value: undefined };

    await this.initialize();

    if (this.queue.length === 0) {
      try {
        await this.yield();
      } catch (err) {
        // only caused by cancel
        this.done = true;
        this.maybeTeardown();

        return { done: true, value: undefined };
      }
    }

    if (this.queue.length > 0) {
      const value = this.queue.shift() as T;
      const done = this.done && this.queue.length === 1;

      return { done, value };
    } else {
      return this.next();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw(err: any): Promise<IteratorResult<T>> {
    this.done = true;
    this.maybeTeardown();
    this.maybeCancel();

    return Promise.reject(err);
  }

  async return(): Promise<IteratorResult<T>> {
    this.done = true;
    this.maybeTeardown();
    this.maybeCancel();

    return { done: true, value: undefined };
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  protected yield() {
    if (!this.yielding) {
      this.yielding = new Promise<void>((resolve, reject) => {
        this.continue = resolve;
        this.cancel = reject;
      });
    }

    return this.yielding;
  }

  protected maybeContinue() {
    if (this.continue) this.continue();
    this.continue = undefined;
    this.cancel = undefined;
    this.yielding = undefined;
  }

  protected maybeCancel() {
    if (this.cancel) this.cancel();
    this.continue = undefined;
    this.cancel = undefined;
    this.yielding = undefined;
  }

  protected maybeTeardown() {
    if (this.teardown) this.teardown();
    this.teardown = undefined;
  }
}
