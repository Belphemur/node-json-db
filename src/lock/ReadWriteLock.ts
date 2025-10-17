import { TimeoutError } from "./Error";

/**
 * Lock type enumeration
 */
export enum LockType {
  READ = "read",
  WRITE = "write",
}

/**
 * Lock request interface
 */
export interface LockRequest {
  type: LockType;
  resolve: () => void;
  reject: (error: Error) => void;
  timeout?: number;
  timeoutId?: NodeJS.Timeout;
}

/**
 * Pooled release function to reduce object allocation
 */
interface PooledReleaseFunction {
  (): void;
  _isPooled?: boolean;
  _lockInstance?: ReadWriteLock;
  _lockType?: LockType;
}

/**
 * ReadWriteLock implementation with high-performance optimizations
 * Features fast path for uncontended locks and object pooling
 */
export class ReadWriteLock {
  private readers: number = 0;
  private writer: boolean = false;
  private queue: LockRequest[] = [];
  private maxReaders: number = Infinity;

  // Object pools for performance optimization
  private readReleasePool: PooledReleaseFunction[] = [];
  private writeReleasePool: PooledReleaseFunction[] = [];
  private requestPool: LockRequest[] = [];

  /**
   * Acquire a read lock with fast path optimization
   * @param timeout Optional timeout in milliseconds
   * @returns Promise that resolves when lock is acquired, or synchronous result for fast path
   */
  async readLock(timeout?: number): Promise<() => void> {
    // Fast path: Check if we can acquire immediately without contention
    if (
      !this.writer &&
      this.queue.length === 0 &&
      this.readers < this.maxReaders
    ) {
      // Synchronous fast path - no Promise overhead
      this.readers++;
      return this.getPooledReadRelease();
    }

    // Slow path: Need to queue the request
    return new Promise<() => void>((resolve, reject) => {
      const request = this.getPooledRequest();
      request.type = LockType.READ;
      request.resolve = () => {
        this.readers++;
        resolve(this.getPooledReadRelease());
      };
      request.reject = reject;
      request.timeout = timeout;
      request.timeoutId = undefined;

      if (timeout !== undefined) {
        request.timeoutId = setTimeout(() => {
          this.removeFromQueue(request);
          this.returnRequestToPool(request);
          reject(new TimeoutError("Read lock timeout", 100));
        }, timeout);
      }

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Acquire a write lock with fast path optimization
   * @param timeout Optional timeout in milliseconds
   * @returns Promise that resolves when lock is acquired, or synchronous result for fast path
   */
  async writeLock(timeout?: number): Promise<() => void> {
    // Fast path: Check if we can acquire immediately without contention
    if (this.readers === 0 && !this.writer && this.queue.length === 0) {
      // Synchronous fast path - no Promise overhead
      this.writer = true;
      return this.getPooledWriteRelease();
    }

    // Slow path: Need to queue the request
    return new Promise<() => void>((resolve, reject) => {
      const request = this.getPooledRequest();
      request.type = LockType.WRITE;
      request.resolve = () => {
        this.writer = true;
        resolve(this.getPooledWriteRelease());
      };
      request.reject = reject;
      request.timeout = timeout;
      request.timeoutId = undefined;

      if (timeout !== undefined) {
        request.timeoutId = setTimeout(() => {
          this.removeFromQueue(request);
          this.returnRequestToPool(request);
          reject(new TimeoutError("Write lock timeout", 100));
        }, timeout);
      }

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Get a pooled read release function
   */
  private getPooledReadRelease(): PooledReleaseFunction {
    let releaseFunc = this.readReleasePool.pop();
    if (!releaseFunc) {
      releaseFunc = () => {
        this.readers = Math.max(0, this.readers - 1);
        this.processQueue();
        // Return to pool for reuse
        if (releaseFunc && releaseFunc._isPooled) {
          this.readReleasePool.push(releaseFunc);
        }
      };
      releaseFunc._isPooled = true;
      releaseFunc._lockInstance = this;
      releaseFunc._lockType = LockType.READ;
    }
    return releaseFunc;
  }

  /**
   * Get a pooled write release function
   */
  private getPooledWriteRelease(): PooledReleaseFunction {
    let releaseFunc = this.writeReleasePool.pop();
    if (!releaseFunc) {
      releaseFunc = () => {
        this.writer = false;
        this.processQueue();
        // Return to pool for reuse
        if (releaseFunc && releaseFunc._isPooled) {
          this.writeReleasePool.push(releaseFunc);
        }
      };
      releaseFunc._isPooled = true;
      releaseFunc._lockInstance = this;
      releaseFunc._lockType = LockType.WRITE;
    }
    return releaseFunc;
  }

  /**
   * Get a pooled request object
   */
  private getPooledRequest(): LockRequest {
    const request = this.requestPool.pop();
    if (request) {
      // Reset the request object
      request.timeoutId = undefined;
      return request;
    }

    // Create new request if pool is empty
    return {
      type: LockType.READ, // Will be overwritten
      resolve: () => {}, // Will be overwritten
      reject: () => {}, // Will be overwritten
    };
  }

  /**
   * Return a request object to the pool
   */
  private returnRequestToPool(request: LockRequest): void {
    // Clear any timeout
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
      request.timeoutId = undefined;
    }

    // Reset properties to avoid memory leaks
    request.resolve = () => {};
    request.reject = () => {};
    request.timeout = undefined;

    // Return to pool if not too large
    if (this.requestPool.length < 10) {
      this.requestPool.push(request);
    }
  }

  /**
   * Process the lock request queue with optimizations
   */
  private processQueue(): void {
    while (this.queue.length > 0) {
      const request = this.queue[0];

      // Check if we can grant the lock
      if (this.canGrantLock(request)) {
        // Remove from queue and clear timeout
        this.queue.shift();
        if (request.timeoutId) {
          clearTimeout(request.timeoutId);
        }

        // Grant the lock
        request.resolve();

        // Return request to pool
        this.returnRequestToPool(request);
      } else {
        // Can't grant this lock, stop processing
        break;
      }
    }
  }

  /**
   * Check if a lock request can be granted
   */
  private canGrantLock(request: LockRequest): boolean {
    switch (request.type) {
      case LockType.READ:
        // Can grant read lock if no writer is active and within max readers limit
        return !this.writer && this.readers < this.maxReaders;
      case LockType.WRITE:
        // Can grant write lock only if no readers or writers are active
        return this.readers === 0 && !this.writer;
      default:
        return false;
    }
  }

  /**
   * Remove a request from the queue (used for timeout cleanup)
   */
  private removeFromQueue(request: LockRequest): void {
    const index = this.queue.indexOf(request);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Get current lock status for debugging
   */
  getStatus(): { readers: number; writer: boolean; queueLength: number } {
    return {
      readers: this.readers,
      writer: this.writer,
      queueLength: this.queue.length,
    };
  }

  /**
   * Set maximum number of concurrent readers
   */
  setMaxReaders(max: number): void {
    this.maxReaders = max;
  }

  /**
   * Clean up all pending timeouts and clear pools (useful for shutdown)
   */
  cleanup(): void {
    // Clear pending timeouts
    for (const request of this.queue) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
    }

    // Clear all state
    this.queue.length = 0;
    this.readers = 0;
    this.writer = false;

    // Clear object pools
    this.readReleasePool.length = 0;
    this.writeReleasePool.length = 0;
    this.requestPool.length = 0;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    readers: number;
    writer: boolean;
    queueLength: number;
    poolSizes: {
      readRelease: number;
      writeRelease: number;
      requests: number;
    };
  } {
    return {
      readers: this.readers,
      writer: this.writer,
      queueLength: this.queue.length,
      poolSizes: {
        readRelease: this.readReleasePool.length,
        writeRelease: this.writeReleasePool.length,
        requests: this.requestPool.length,
      },
    };
  }
}
