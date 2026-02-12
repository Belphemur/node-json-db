import { Config } from "../src/lib/JsonDBConfig";
import { JsonDB } from "../src/JsonDB";
import { randomBytes, randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { CipheredFileAdapter } from "../src/adapter/file/CipheredFileAdapter";

describe('Cyphered', () => {
    const getData = () => ({
        "test": "hello world!!"
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
        test('cipherkey too small', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)
            expect(() => conf.setEncryption(getTooSmallKey())).toThrow("Invalid key length, 32 bytes expected")
            
        });

        test('cipherkey ok', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)
            let error = false

            expect(() => conf.setEncryption(getKey())).not.toThrow("Invalid key length, 32 bytes expected")
         
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

        test('open/push/reopen', async () => {
            const key = getKey()
            const dbPath = getDbPath()
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            conf.setEncryption(key)
            const db = new JsonDB(conf);
            
            await db.push(`/`, getData(), true);

            const db2 = new JsonDB(conf)
            const data = await db2.getData("/test")
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

    describe('errors', () => {
        test('readAsync decrypt error', async () => {
            const dbPath = getDbPath()
            
            const writeAdapter = new CipheredFileAdapter(getKey(), dbPath, true)
            await writeAdapter.writeAsync(JSON.stringify(getData()))

            const adapter = new CipheredFileAdapter(getTooSmallKey(), dbPath, true)
            await expect(adapter.readAsync()).rejects.toThrow()
        });

        test('readAsync parse JSON error', async () => {
            const dbPath = getDbPath()
            
            writeFileSync(dbPath, getData().test)

            const adapter = new CipheredFileAdapter(getKey(), dbPath, true)
            await expect(adapter.readAsync()).rejects.toThrow()
        });


        test('wrtiteAsync error', async () => {
            const dbPath = getDbPath()
            const adapter = new CipheredFileAdapter(getTooSmallKey(), dbPath, true)
            await expect(adapter.writeAsync(JSON.stringify(getData()))).rejects.toThrow()

        });
    });
})
