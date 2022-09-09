import {Config} from "../src/lib/JsonDBConfig";
import {JsonDB} from "../src/JsonDB";
import fs from "fs";


let counter = 0;

async function addData(db: JsonDB) {
    let k = `/record/key${counter}`;
    let record = {
        strval: `value ${counter}`,
        intval: counter
    };
    counter++;

    return await db.push(k, record, false);
}

describe('Concurrency', () => {
    const db = new JsonDB(new Config('concurrency'));
    describe('Multi write', () => {
        test('shouldn\'t corrupt the data', async () => {
            let promiseList = [];
            for (let i = 0; i < 10; i++) {
                // NOTE: pushing the promise without awaiting for it!
                promiseList.push(addData(db));
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
        })

    });
    describe('Mutli-read', () => {
        test('should be able to set own adapter with config', async () => {

        });
    });
    describe('Cleanup', () => {
        test('should remove the test files', () => {
            fs.unlinkSync("concurrency.json")
        })
    });
})
