import { Config } from "../src/lib/JsonDBConfig";
import { JsonDB } from "../src/JsonDB";
import { generateKeyPairSync, generateKeySync, randomBytes, randomUUID } from "crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { CipheredFileAdapter } from "../src/adapter/file/CipheredFileAdapter";
import { DataError } from "../src/lib/Errors";

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
            expect(() => conf.setEncryption("1234567890")).toThrow()

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
            const rawData = JSON.parse(readFileSync(dbPath+'.enc.json').toString())
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
            const oldData = JSON.parse(readFileSync(dbPath+'.enc.json').toString())
            expect(oldData.iv).not.toBeNull()
            expect(oldData.tag).not.toBeNull()
            expect(oldData.data).not.toBeNull()


            await db.push(`/`, getData(), true);
            const newData = JSON.parse(readFileSync(dbPath+'.enc.json').toString())
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

    describe('file extension', () => {
        afterEach(() => {
            // Clean up test files
            const testFiles = [
                '/tmp/test-enc-db.enc.json',
                '/tmp/test-enc-db.json',
                '/tmp/test-db.json',
                '/tmp/test-db.enc.json',
                '/tmp/test-db.custom',
            ];
            testFiles.forEach(file => {
                if (existsSync(file)) {
                    unlinkSync(file);
                }
            });
        });

        test('file extension changes to .enc.json when encryption is enabled', async () => {
            const key = getKey()
            const dbPath = '/tmp/test-enc-db'
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            
            // Before encryption - should be .json
            expect(conf.filename).toBe('/tmp/test-enc-db.json')
            
            conf.setEncryption(key)
            
            // After encryption - should be .enc.json
            expect(conf.filename).toBe('/tmp/test-enc-db.enc.json')
            
            const db = new JsonDB(conf);
            await db.push(`/`, getData(), true);
            
            // Verify the encrypted file exists
            expect(existsSync('/tmp/test-enc-db.enc.json')).toBe(true)
            // Verify the non-encrypted file does not exist
            expect(existsSync('/tmp/test-enc-db.json')).toBe(false)
        });

        test('file with .json extension becomes .enc.json', async () => {
            const key = getKey()
            const dbPath = '/tmp/test-db.json'
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            
            expect(conf.filename).toBe('/tmp/test-db.json')
            
            conf.setEncryption(key)
            
            expect(conf.filename).toBe('/tmp/test-db.enc.json')
        });

        test('encrypted database writes to .enc.json file', async () => {
            const key = getKey()
            const dbPath = '/tmp/test-enc-db'
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            conf.setEncryption(key)
            
            const db = new JsonDB(conf);
            await db.push(`/`, getData(), true);
            
            // Check that the file is created with correct extension
            expect(existsSync('/tmp/test-enc-db.enc.json')).toBe(true)
            
            // Verify the content is encrypted
            const rawData = JSON.parse(readFileSync('/tmp/test-enc-db.enc.json').toString())
            expect(rawData.iv).toBeDefined()
            expect(rawData.tag).toBeDefined()
            expect(rawData.data).toBeDefined()
        });

        test('file with custom extension becomes .enc.json', async () => {
            const key = getKey()
            const dbPath = '/tmp/test-db.custom'
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            
            expect(conf.filename).toBe('/tmp/test-db.custom')
            
            conf.setEncryption(key)
            
            expect(conf.filename).toBe('/tmp/test-db.enc.json')
        });

        test('setEncryption is idempotent', async () => {
            const key = getKey()
            const dbPath = '/tmp/test-db'
            const conf = new Config(dbPath, true)
            conf.syncOnSave = true
            
            conf.setEncryption(key)
            expect(conf.filename).toBe('/tmp/test-db.enc.json')
            
            // Call setEncryption again with same key
            conf.setEncryption(key)
            expect(conf.filename).toBe('/tmp/test-db.enc.json')
            
            // Call setEncryption again with different key
            const key2 = getKey()
            conf.setEncryption(key2)
            expect(conf.filename).toBe('/tmp/test-db.enc.json')
        });
    });

    describe('encryption mismatch protection', () => {
        afterEach(() => {
            // Clean up test files
            const testFiles = [
                '/tmp/mismatch-test.enc.json',
                '/tmp/mismatch-test.json',
            ];
            testFiles.forEach(file => {
                if (existsSync(file)) {
                    unlinkSync(file);
                }
            });
        });

        test('cannot read encrypted database without encryption key', async () => {
            const key = getKey()
            const dbPath = '/tmp/mismatch-test'
            
            // Create an encrypted database
            const confEncrypted = new Config(dbPath, true)
            confEncrypted.syncOnSave = true
            confEncrypted.setEncryption(key)
            const dbEncrypted = new JsonDB(confEncrypted);
            await dbEncrypted.push(`/`, getData(), true);
            
            // Try to open it without encryption
            const confPlain = new Config(dbPath, true)
            const dbPlain = new JsonDB(confPlain);
            
            // This should fail because the file doesn't exist at .json path
            await expect(dbPlain.getData("/test")).rejects.toThrow(DataError)
        });

        test('cannot read non-encrypted database with wrong filename when using encryption', async () => {
            const dbPath = '/tmp/mismatch-test'
            
            // Create a non-encrypted database
            const confPlain = new Config(dbPath, true)
            confPlain.syncOnSave = true
            const dbPlain = new JsonDB(confPlain);
            await dbPlain.push(`/`, getData(), true);
            
            // Verify .json file exists
            expect(existsSync('/tmp/mismatch-test.json')).toBe(true)
            
            // Try to open it with encryption
            const key = getKey()
            const confEncrypted = new Config(dbPath, true)
            confEncrypted.setEncryption(key)
            const dbEncrypted = new JsonDB(confEncrypted);
            
            // This should fail because it looks for .enc.json file which doesn't exist
            await expect(dbEncrypted.getData("/test")).rejects.toThrow(DataError)
        });

        test('reading encrypted file with wrong key fails', async () => {
            const key1 = getKey()
            const key2 = getKey()
            const dbPath = '/tmp/mismatch-test'
            
            // Create database with key1
            const conf1 = new Config(dbPath, true)
            conf1.syncOnSave = true
            conf1.setEncryption(key1)
            const db1 = new JsonDB(conf1);
            await db1.push(`/`, getData(), true);
            
            // Try to read with key2
            const conf2 = new Config(dbPath, true)
            conf2.setEncryption(key2)
            const db2 = new JsonDB(conf2);
            
            // Should fail to decrypt
            await expect(db2.getData("/test")).rejects.toThrow()
        });
    });
})
