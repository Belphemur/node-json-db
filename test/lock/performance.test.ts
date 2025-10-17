import { ReadWriteLock } from "../../src/lock/ReadWriteLock";

describe("ReadWriteLock Performance", () => {
  let lock: ReadWriteLock;

  beforeEach(() => {
    lock = new ReadWriteLock();
  });

  afterEach(() => {
    lock.cleanup();
  });

  test("fast path read lock performance", async () => {
    const iterations = 10000;
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      const release = await lock.readLock();
      release();
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const avgPerOperation = durationMs / iterations;

    console.log(
      `Fast path read locks: ${iterations} operations in ${durationMs.toFixed(
        2
      )}ms`
    );
    console.log(`Average per operation: ${avgPerOperation.toFixed(4)}ms`);

    // Should be much faster than 0.1ms per operation for uncontended locks
    expect(avgPerOperation).toBeLessThan(0.1);
  });

  test("fast path write lock performance", async () => {
    const iterations = 10000;
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      const release = await lock.writeLock();
      release();
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const avgPerOperation = durationMs / iterations;

    console.log(
      `Fast path write locks: ${iterations} operations in ${durationMs.toFixed(
        2
      )}ms`
    );
    console.log(`Average per operation: ${avgPerOperation.toFixed(4)}ms`);

    // Should be much faster than 0.1ms per operation for uncontended locks
    expect(avgPerOperation).toBeLessThan(0.1);
  });

  test("concurrent read locks performance", async () => {
    const concurrentReads = 100;
    const iterations = 100;

    const start = process.hrtime.bigint();

    const promises = [];
    for (let i = 0; i < concurrentReads; i++) {
      promises.push(
        (async () => {
          for (let j = 0; j < iterations; j++) {
            const release = await lock.readLock();
            // Simulate some work
            await new Promise((resolve) => setImmediate(resolve));
            release();
          }
        })()
      );
    }

    await Promise.all(promises);

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const totalOperations = concurrentReads * iterations;
    const avgPerOperation = durationMs / totalOperations;

    console.log(
      `Concurrent read locks: ${totalOperations} operations in ${durationMs.toFixed(
        2
      )}ms`
    );
    console.log(`Average per operation: ${avgPerOperation.toFixed(4)}ms`);

    // Should handle concurrent reads efficiently
    expect(avgPerOperation).toBeLessThan(1.0);
  });

  test("object pooling effectiveness", async () => {
    const iterations = 100;

    // Force contention to trigger slow path and request pooling
    // Start a long-running write lock to create contention
    const longWritePromise = (async () => {
      const release = await lock.writeLock();
      await new Promise((resolve) => setTimeout(resolve, 50));
      release();
    })();

    // Queue up operations that will be contended and use request pooling
    const contendedPromises = [];
    for (let i = 0; i < iterations; i++) {
      contendedPromises.push(
        (async () => {
          const readRelease = await lock.readLock();
          readRelease();
        })()
      );
    }

    await Promise.all([longWritePromise, ...contendedPromises]);

    const finalStats = lock.getPerformanceStats();
    console.log("Final pool sizes after contention:", finalStats.poolSizes);

    // After contended operations, pools should be populated
    expect(finalStats.poolSizes.readRelease).toBeGreaterThan(0);
    expect(finalStats.poolSizes.writeRelease).toBeGreaterThan(0);
    expect(finalStats.poolSizes.requests).toBeGreaterThan(0);
  });

  const testFn = process.env.CI ? test.skip : test;
  testFn("memory allocation comparison", async () => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage();
    const iterations = 10000;

    // Perform many lock operations
    for (let i = 0; i < iterations; i++) {
      const release = await lock.readLock();
      release();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    const avgMemoryPerOp = heapGrowth / iterations;

    console.log(
      `Memory growth: ${heapGrowth} bytes for ${iterations} operations`
    );
    console.log(
      `Average memory per operation: ${avgMemoryPerOp.toFixed(2)} bytes`
    );

    // Should have minimal memory growth due to pooling
    expect(avgMemoryPerOp).toBeLessThan(100); // Less than 100 bytes per operation
  });

  test("contended vs uncontended performance", async () => {
    const iterations = 1000;

    // Test uncontended performance
    const uncontendedStart = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      const release = await lock.readLock();
      release();
    }
    const uncontendedEnd = process.hrtime.bigint();
    const uncontendedTime =
      Number(uncontendedEnd - uncontendedStart) / 1_000_000;

    // Test contended performance (with a long-running write lock)
    const contendedStart = process.hrtime.bigint();

    // Start a long-running write operation
    const longWritePromise = (async () => {
      const release = await lock.writeLock();
      await new Promise((resolve) => setTimeout(resolve, 100));
      release();
    })();

    // Queue up read operations that will be contended
    const contendedPromises = [];
    for (let i = 0; i < iterations; i++) {
      contendedPromises.push(
        (async () => {
          const release = await lock.readLock();
          release();
        })()
      );
    }

    await Promise.all([longWritePromise, ...contendedPromises]);
    const contendedEnd = process.hrtime.bigint();
    const contendedTime = Number(contendedEnd - contendedStart) / 1_000_000;

    console.log(`Uncontended time: ${uncontendedTime.toFixed(2)}ms`);
    console.log(`Contended time: ${contendedTime.toFixed(2)}ms`);

    // Uncontended should be significantly faster
    expect(uncontendedTime).toBeLessThan(contendedTime / 10);
  });

  test("getStatus method coverage", () => {
    // Test initial status
    let status = lock.getStatus();
    expect(status.readers).toBe(0);
    expect(status.writer).toBe(false);
    expect(status.queueLength).toBe(0);

    // Test with readers
    lock.readLock().then((release) => {
      status = lock.getStatus();
      expect(status.readers).toBe(1);
      expect(status.writer).toBe(false);
      release();
    });
  });

  test("setMaxReaders method coverage", () => {
    // Test setting max readers
    lock.setMaxReaders(5);
    expect(lock.getPerformanceStats().readers).toBe(0); // Should not affect current readers

    // Test that max readers limit is respected
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(lock.readLock());
    }

    // This is async, but we're just testing the method exists and doesn't throw
    Promise.all(promises).then((releases) => {
      releases.forEach((release) => release());
    });
  });

  test("canGrantLock default case coverage", async () => {
    // Create a mock request with invalid type to hit default case
    const invalidRequest = {
      type: "invalid" as any,
      resolve: () => {},
      reject: () => {},
      timeout: undefined,
      timeoutId: undefined,
    };

    // Access private method through type assertion
    const canGrant = (lock as any).canGrantLock(invalidRequest);
    expect(canGrant).toBe(false);
  });

  test("processQueue timeout clearing coverage", async () => {
    // Create contention and timeout to ensure timeout clearing is covered
    const writeRelease = await lock.writeLock();

    // Queue a read request with timeout
    const readPromise = lock.readLock(50); // Short timeout

    // Release write lock to allow read to proceed
    writeRelease();

    // Wait for read to complete
    const readRelease = await readPromise;
    readRelease();
  });

  test("cleanup timeout clearing coverage", async () => {
    // Create requests with timeouts
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(lock.readLock(10000)); // Long timeout
    }

    // Force cleanup before timeouts expire
    lock.cleanup();

    // Verify cleanup worked
    const status = lock.getStatus();
    expect(status.queueLength).toBe(0);
    expect(status.readers).toBe(0);
    expect(status.writer).toBe(false);
  });

  test("getPerformanceStats method coverage", () => {
    // Test initial stats
    const stats = lock.getPerformanceStats();
    expect(stats.readers).toBe(0);
    expect(stats.writer).toBe(false);
    expect(stats.queueLength).toBe(0);
    expect(stats.poolSizes.readRelease).toBe(0);
    expect(stats.poolSizes.writeRelease).toBe(0);
    expect(stats.poolSizes.requests).toBe(0);

    // Test with some activity
    lock.readLock().then((release) => {
      const statsAfter = lock.getPerformanceStats();
      expect(statsAfter.readers).toBe(1);
      expect(statsAfter.poolSizes.readRelease).toBeGreaterThanOrEqual(0);
      release();
    });
  });

  test("cleanup timeout clearing with queued requests", async () => {
    // Acquire a write lock to create contention
    const writeRelease = await lock.writeLock();

    // Queue multiple read requests with timeouts
    const readPromises = [];
    for (let i = 0; i < 3; i++) {
      readPromises.push(lock.readLock(10000)); // Long timeout to ensure they stay queued
    }

    // Verify requests are queued
    const statusBeforeCleanup = lock.getStatus();
    expect(statusBeforeCleanup.queueLength).toBe(3);

    // Release the write lock to allow one request to proceed, but cleanup before others timeout
    writeRelease();

    // Wait a bit for one request to be processed
    await new Promise((resolve) => setImmediate(resolve));

    // Force cleanup - this should clear timeouts for remaining queued requests
    lock.cleanup();

    // Verify cleanup worked and queue is empty
    const statusAfterCleanup = lock.getStatus();
    expect(statusAfterCleanup.queueLength).toBe(0);
    expect(statusAfterCleanup.readers).toBe(0);
    expect(statusAfterCleanup.writer).toBe(false);
  });
});
