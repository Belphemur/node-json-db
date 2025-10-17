import { ReadWriteLock } from "./ReadWriteLock";
import { TimeoutError } from "./Error";

const lock = new ReadWriteLock();

/**
 * take a read lock that will be released when the function has finished running
 * @param func
 * @param timeout time in ms to wait to get the lock. Null mean infinite.
 */
export const readLockAsync = <T>(
  func: () => Promise<T>,
  timeout: number | null = null
): Promise<T> => {
  return new Promise<T>(async (resolve, reject) => {
    try {
      const release = await lock.readLock(timeout ?? undefined);
      try {
        const result = await func();
        resolve(result);
      } finally {
        release();
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        reject(error);
      } else {
        reject(error);
      }
    }
  });
};

/**
 * Take a write lock that will be released when the function has finished running
 * @param func
 * @param timeout time in ms to wait to get the lock. Null mean infinite.
 */
export const writeLockAsync = <T>(
  func: () => Promise<T>,
  timeout: number | null = null
): Promise<T> => {
  return new Promise<T>(async (resolve, reject) => {
    try {
      const release = await lock.writeLock(timeout ?? undefined);
      try {
        const result = await func();
        resolve(result);
      } finally {
        release();
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        reject(error);
      } else {
        reject(error);
      }
    }
  });
};
