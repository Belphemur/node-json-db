import {FileAdapter} from "../../src/adapter/file/FileAdapter";
import * as fs from "fs";
import * as fsPromise from 'node:fs/promises'
import {JsonAdapter} from "../../src/adapter/data/JsonAdapter";
import {IAdapter} from "../../src/adapter/IAdapter";
import {ConfigWithAdapter} from "../../src/lib/JsonDBConfig";
import {DataError} from "../../src/lib/Errors";

function checkFileExists(file: string): Promise<boolean> {
    return fs.promises.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
}

class MemoryAdapter implements IAdapter<any> {
    private data: any = {};

    readAsync(): Promise<any> {
        return Promise.resolve(this.data);
    }

    writeAsync(data: any): Promise<void> {
        this.data = data;
        return Promise.resolve(undefined);
    }

}

describe('Adapter', () => {
    afterEach(()=>{
        try {
            fs.rmSync("data/test.file")
        }
        catch {
        }
        try {
            fs.rmSync("data/test.json")
        }
        catch {
        }
    })
    describe('File', () => {
        test('should be able to write then read to a file', async () => {
            const filename = "data/test.file";
            const data = "Hello World";

            const adapter = new FileAdapter(filename, false);
            await adapter.writeAsync(data);
            const exists = await checkFileExists(filename);
            expect(exists).toBeTruthy();
            const content = await adapter.readAsync();
            expect(content).toBe(data);
        })
        test('should return null data when file doesn\'t exists', async () => {
            const filename = "data/test2.file";

            const adapter = new FileAdapter(filename, false);
            const data = await adapter.readAsync();
            expect(data).toBeNull();

        })
        test('should be able to read/write a file with fsync', async () => {
            const filename = "data/test.file";
            const data = "hello fsync";

            const adapter = new FileAdapter(filename, true);
            await adapter.writeAsync(data);
            const exists = await checkFileExists(filename);
            expect(exists).toBeTruthy();
            const content = await adapter.readAsync();
            expect(content).toBe(data);
        })
        test('should throw error with null character in path when reading', async () => {
            const filename = "data/\0";

            const adapter = new FileAdapter(filename, false);

            await expect(async () => await adapter.readAsync()).rejects.toThrow()
        })
        test('should throw error with null character in path when writting', async () => {
            const filename = "data/\0";

            const adapter = new FileAdapter(filename, false);

            await expect(async () => await adapter.writeAsync("test")).rejects.toThrow()
        })
        describe('Json', () => {
            test('should be able to write then read to a file', async () => {
                const filename = "data/test.json";
                const data = {Hello: "World", Foo: "Bar"};

                const adapter = new JsonAdapter(new FileAdapter(filename, false), false);
                await adapter.writeAsync(data);
                const exists = await checkFileExists(filename);
                expect(exists).toBeTruthy();
                const content = await adapter.readAsync();
                expect(content.Hello).toBe("World")
                expect(content.Foo).toBe("Bar");
            })
            test('should create file when loading if it doesn\'t exists', async () => {
                const filename = "data/test.json";
                const adapter = new JsonAdapter(new FileAdapter(filename, false), false);
                await adapter.readAsync();

                const fileExists = await checkFileExists(filename);
                expect(fileExists).toBeTruthy();

            })

            test('should override empty file when loading', async () => {
                const filename = "data/emptyFile.json";
                let fh = await fsPromise.open(filename, 'a');
                await fh.close();
                const adapter = new JsonAdapter(new FileAdapter(filename, false), false);
                await adapter.readAsync();

                const fileExists = await checkFileExists(filename);
                expect(fileExists).toBeTruthy();
                await fsPromise.rm(filename);
            })

            test('should serialize and deserialize dates', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    myDate: new Date()
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject).not.toBeNaN();
                expect(readObject.myDate).toBeInstanceOf(Date);
                expect(readObject.myDate.toString()).toBe(data.myDate.toString())
            })


            test('should serialize and deserialize date and other types', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    myDate: new Date(),
                    hello: "world",
                    test: 1215484
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject).not.toBeNaN();
                expect(readObject.myDate).toBeInstanceOf(Date);
                expect(readObject.myDate.toString()).toBe(data.myDate.toString());
                expect(readObject.hello).toBe(data.hello);
                expect(readObject.test).toBe(data.test);
            })
        })
    });
    describe('Config', () => {
        test('should be able to set own adapter with config', async () => {
            const config = new ConfigWithAdapter(new MemoryAdapter());
            await config.adapter.writeAsync({test: "test"});
            const result = await config.adapter.readAsync();
            expect(result.test).toBe("test");
        });
    });
});
