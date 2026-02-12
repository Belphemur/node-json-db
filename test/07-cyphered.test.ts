import { Config } from "../src/lib/JsonDBConfig";
import { JsonAdapter, JsonDB } from "../src/JsonDB";
import { randomBytes, randomUUID } from "crypto";
import { get } from "http";
import { readFileSync } from "fs";
import { CipheredFileAdapter } from "../src/adapter/file/CipheredFileAdapter";

describe('Cyphered', () => {
    /*
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
    */

    const getData = () => ({
        "test": "hellow world!!"
    })

    const getKey = () => randomBytes(32)
    const getTooSmallKey = () => randomBytes(24)

    const getDbPath = ()  => {
        return `/tmp/${randomUUID()}`
    }

    describe('encryption', () => {
        test('encrypt', async () => {
            const dbPath = getDbPath()

            const adapter = new CipheredFileAdapter(getKey(), dbPath, true)
            const cipheredData = await adapter.encrypt("test")
            expect(cipheredData.data).not.toBe("test")
            
        });

        test('decrypt', async () => {
            const dbPath = getDbPath()
            
            const adapter = new CipheredFileAdapter(getKey(), dbPath, true)
            const cipheredData = await adapter.encrypt("test")
            const uncipheredData = await adapter.decrypt(cipheredData)
            expect(uncipheredData).toBe("test")
        });
    })

    describe('cipherkey', () => {
        test('ciperkey too small', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)

            try {
                conf.setEncryption(getTooSmallKey())
            } catch (err: any) {
                expect(err.message).toBe("Invalid key length, 32 chars expected")
            }
            
        });

        test('ciperkey ok', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)
            let error = false
            try {
                conf.setEncryption(getKey())
            } catch (err: any) {
               error = true
            }
            expect(error).toBeFalsy()
        });
    })

    describe('encrypted db', () => {

        test('ciper data', async () => {
            const key = getKey()
            const dbPath = getDbPath()
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            conf.setEncryption(key)
            const db = new JsonDB(conf);
            
            await db.push(`/`, getData(), true);
            const rawData = JSON.parse(readFileSync(dbPath+'.json').toString())
            expect(rawData.iv).not.toBeNull()
            expect(rawData.tag).not.toBeNull()
            expect(rawData.data).not.toEqual(getData())
        });

        test('ciper/uncipher data', async () => {
            const key = getKey()
            const dbPath = getDbPath()
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            conf.setEncryption(key)
            const db = new JsonDB(conf);
            
            await db.push(`/`, getData(), true);
            const data = await db.getData("/test")
            expect(data).toEqual(getData().test)
        });
    })

    describe('iv & tag renewal', () => {
        test('iv tag & renewal', async () => {
            const key = getKey()
            const dbPath = getDbPath()
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            conf.setEncryption(key)
            const db = new JsonDB(conf);
            
            await db.push(`/`, getData(), true);
            const oldData = JSON.parse(readFileSync(dbPath+'.json').toString())
            expect(oldData.iv).not.toBeNull()
            expect(oldData.tag).not.toBeNull()
            expect(oldData.data).not.toBeNull()


            await db.push(`/`, getData(), true);
            const newData = JSON.parse(readFileSync(dbPath+'.json').toString())
            expect(newData.iv).not.toBe(oldData.iv)
            expect(newData.tag).not.toBe(oldData.tag)
            expect(newData.data).not.toBe(oldData.data)
        });
    });
})
