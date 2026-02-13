import { Config } from "../src/lib/JsonDBConfig";
import { JsonDB } from "../src/JsonDB";
import { generateKeyPairSync, generateKeySync, randomBytes, randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { CipheredFileAdapter } from "../src/adapter/file/CipheredFileAdapter";

describe('Ciphered', () => {
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
            expect(() => conf.setEncryption(getTooSmallKey())).toThrow()

            const key = generateKeySync("hmac", {
               length: 128,
            });

            expect(() => conf.setEncryption(key)).toThrow()


            
        });

        test('cipherkey ok', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)

            expect(() => conf.setEncryption(getKey())).not.toThrow()
         
        });

        test('cipherkey symmetric KeyObject ', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)

            const key = generateKeySync("hmac", {
               length: 256,
            });

            expect(() => conf.setEncryption(key)).not.toThrow()         
        });

        test('cipherkey asymmetric KeyObject not supported ', async () => {
            const dbPath = getDbPath()
            const conf = new Config(dbPath)

            const { publicKey, privateKey } = generateKeyPairSync("rsa", {
                modulusLength: 2048,
            });

            expect(() => conf.setEncryption(publicKey)).toThrow()
            expect(() => conf.setEncryption(privateKey)).toThrow()
         
        });
    })

    describe('encrypted db', () => {

        test('cipher data', async () => {
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
            expect(rawData.data).not.toEqual(JSON.stringify(getData()))
        });

        test('cipher/uncipher data', async () => {
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

        test('readAsync missing decryption iv or tag or data', async () => {
            const dbPath = getDbPath()
            

            const adapter = new CipheredFileAdapter(getKey(), dbPath, true)

            // missing iv
            writeFileSync(dbPath, JSON.stringify({ data: "test", tag: "test" }))
            await expect(adapter.readAsync()).rejects.toThrow()

            // missing tag
            writeFileSync(dbPath, JSON.stringify({ data: "test", iv: "test" }))
            await expect(adapter.readAsync()).rejects.toThrow()

            // missing data
            writeFileSync(dbPath, JSON.stringify({ tag: "test", iv: "test" }))
            await expect(adapter.readAsync()).rejects.toThrow()
        });

        test('writeAsync error', async () => {
            const dbPath = getDbPath()
            const adapter = new CipheredFileAdapter(getTooSmallKey(), dbPath, true)
            await expect(adapter.writeAsync(JSON.stringify(getData()))).rejects.toThrow()

        });
    });
})
