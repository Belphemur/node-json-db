import * as ReadWriteLock from 'rwlock'
import {Options} from "rwlock";
import {TimeoutError} from "./Error";

const lock = new ReadWriteLock();

/**
 * take a read lock that will be released when the function has finished running
 * @param func
 * @param timeout time in ms to wait to get the lock. Null mean infinite.
 */
export const readLockAsync = <T>(func: () => Promise<T>, timeout: number | null = null): Promise<T> => {
    let options: Options = {};

    if (timeout != null) {
        options = {timeout};
    }

    return new Promise<T>((resolve, reject) => {
        lock.readLock(async release => {
            try {
                const result = await func();
                resolve(result);
            } catch (e) {
                reject(e);
            } finally {
                release();
            }
        }, {
            ...options, timeoutCallback() {
                reject(new TimeoutError("Timeout", 100))
            }
        })
    })
};

/**
 * Take a write lock that will be released when the function has finished running
 * @param func
 * @param timeout time in ms to wait to get the lock. Null mean infinite.
 */
export const writeLockAsync = <T>(func: () => Promise<T>, timeout: number | null = null): Promise<T> => {
    let options: Options = {};

    if (timeout != null) {
        options = {timeout};
    }
    return new Promise<T>((resolve, reject) => {
        lock.writeLock(async release => {
            try {
                const result = await func();
                resolve(result);
            } catch (e) {
                reject(e);
            } finally {
                release();
            }
        }, {
            ...options, timeoutCallback() {
                reject(new TimeoutError("Timeout", 100))
            }
        })
    })
};
