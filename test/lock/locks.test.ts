import {readLockAsync, writeLockAsync} from "../../src/lock/Lock";
import {TimeoutError} from "../../src/lock/Error";

describe('Lock', () => {
    test('should be able to just read', async () => {
        let count = 0;
        const currentCount = await readLockAsync(async () => {
            return count;
        })
        expect(currentCount).toBe(count);
    });
    test('should be able to just write', async () => {
        let count = 0;
        const currentCount = await writeLockAsync(async () => {
            return count + 1;
        })
        expect(currentCount).toBe(1);
    });
    test('write should be a blocking operation', async () => {
        let count = 0;
        writeLockAsync(() => new Promise<void>(resolve => {
            setTimeout(() => {
                count = count + 1;
                resolve();
            }, 100)
        }))

        const currentCount = await readLockAsync(async () => {
            return count;
        })

        expect(currentCount).toBe(1);
    });

    test('will timeout if requested', async () => {
        let count = 0;
        writeLockAsync(() => new Promise<void>(resolve => {
            setTimeout(() => {
                count = count + 1;
                resolve();
            }, 100)
        }))

        await expect(async () => await readLockAsync(async () => {
            return count;
        }, 10)).rejects.toThrow(TimeoutError)
    });
});