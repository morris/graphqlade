type AsyncPushIteratorSetup<T> = (
  iterator: AsyncPushIterator<T>
) => Promise<(() => unknown) | undefined> | (() => unknown) | undefined;

/**
 * An AsyncPushIterator is an AsyncIterator that allows pushing
 * data asynchronously. The constructor accepts a setup function
 * which is responsible for setting up the pushing logic (e.g. event listeners)
 * and may return a teardown function which should clean up anything that
 * was done during setup (e.g. removing event listeners).
 * The setup function is called once when the iterator is actually iterated.
 */
export class AsyncPushIterator<T> implements AsyncIterator<T> {
  protected setup: AsyncPushIteratorSetup<T>;
  protected initialized = false;
  protected finished = false;
  protected done = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected error?: any;
  protected queue: T[] = [];
  protected waiting?: Promise<void>;
  protected resolveWait?: () => void;
  protected teardown?: () => void;

  constructor(setup: AsyncPushIteratorSetup<T>) {
    this.setup = setup;
  }

  async next(): Promise<IteratorResult<T>> {
    if (!this.initialized) {
      this.initialized = true;
      this.teardown = await this.setup(this);
    }

    if (this.error) throw this.error;
    if (this.done) return { done: true, value: undefined };

    if (this.queue.length > 0) {
      const value = this.queue.shift() as T;

      return { done: false, value };
    } else if (this.finished) {
      return this.return();
    }

    await this.wait(); // never throws

    return this.next();
  }

  async return(): Promise<IteratorResult<T>> {
    if (!this.done) {
      this.done = true;
      this.finished = true;
      this.teardownOnce();
      this.continue();
    }

    return { done: true, value: undefined };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw(err: any): Promise<IteratorResult<T>> {
    if (!this.done) {
      this.done = true;
      this.error = err;
      this.teardownOnce();
      this.continue();
    }

    const rejection = Promise.reject(err);

    // don't cause uncaught exceptions
    // it's user responsibility to catch errors during iteration
    rejection.catch(() => {
      // ignore
    });

    return rejection;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  //

  /**
   * Push a value to the iterator.
   *
   * @param value
   */
  push(value: T) {
    if (this.finished) return;

    this.queue.push(value);
    this.continue();
  }

  /**
   * Let the iterator finish, i.e. already pushed values will be
   * iterated, but new values are not accepted. After all pushed values
   * are iterated, the iterator returns (stops).
   */
  finish() {
    if (!this.finished) {
      this.finished = true;
      this.continue();
    }
  }

  //

  protected wait() {
    if (!this.waiting) {
      this.waiting = new Promise<void>((resolve) => {
        this.resolveWait = resolve;
      });
    }

    return this.waiting;
  }

  protected continue() {
    if (!this.resolveWait) return;

    this.resolveWait();
    this.resolveWait = undefined;
    this.waiting = undefined;
  }

  protected teardownOnce() {
    if (!this.teardown) return;

    try {
      this.teardown();
    } catch (err) {
      // may hide original error, but errors during teardown
      // are more critical and need to be fixed first
      this.error = err;
    } finally {
      this.teardown = undefined;
    }
  }
}
