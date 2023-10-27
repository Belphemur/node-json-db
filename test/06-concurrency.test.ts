import { Config } from "../src/lib/JsonDBConfig";
import { JsonDB } from "../src/JsonDB";
import * as fs from 'fs'

describe('Concurrency', () => {
    let counter = 0;
    async function addData(db: JsonDB) {
        let k = `/record/key${counter}`;
        let record = {
            strval: `value ${counter}`,
            intval: counter
        };
        counter++;
        await db.push(k, record, false);
    }

    afterEach(() => {
        try {
            fs.rmSync("test-concurrent-write.json")
        }
        catch {
        }
        try {
            fs.rmSync("test-concurrent-read.json")
        }
        catch {
        }
    })

    describe('Multi push', () => {
        test('should not corrupt the data', async () => {
            const db = new JsonDB(new Config('test-concurrent-write'));
            db.resetData({});
            let promiseList = [];
            for (let i = 0; i < 10; i++) {
                // NOTE: pushing the promise without awaiting for it!
                promiseList.push(addData(db) as never);
            }

            // Represent multiple async contexts, all running concurrently
            await Promise.all(promiseList);

            const result = await db.getData("/");
            expect(result).toHaveProperty('record');
            for (let i = 0; i < 10; i++) {
                expect(result.record).toHaveProperty(`key${i}`)
                expect(result.record[`key${i}`].strval).toBe(`value ${i}`);
                expect(result.record[`key${i}`].intval).toBe(i);
            }
            expect(counter).toBe(10)
        })

    });
    describe('Multi getData', () => {
        test('should be blocking and wait for push to finish', async () => {
            const db = new JsonDB(new Config('test-concurrent-read'));
            let counter = 1;
            let record = {
                strval: `value ${counter}`,
                intval: counter
            };
            //We don't await the promise directly, to trigger a concurrent case
            const pushPromise = db.push(`/test/key${counter}`, record, false);
            const data = await db.getData("/test")

            await pushPromise;

            expect(data).toHaveProperty(`key${counter}`)
            expect(data[`key${counter}`]).toEqual(record);
        });
    });
})
