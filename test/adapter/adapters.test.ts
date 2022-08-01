import {AtomicFileAdapter} from "../../src/adapter/file/AtomicFileAdapter";
import * as fs from "fs";
import {JsonAdapter} from "../../src/adapter/data/JsonAdapter";
import {IAdapter} from "../../src/adapter/IAdapter";
import {ConfigWithAdapter} from "../../src/lib/JsonDBConfig";

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
    describe('Atomic', () => {
        test('should be able to write then read to a file', async () => {
            const filename = "data/test.file";
            const data = "Hello World";

            const adapter = new AtomicFileAdapter(filename, false);
            await adapter.writeAsync(data);
            const exists = await checkFileExists(filename);
            expect(exists).toBeTruthy();
            const content = await adapter.readAsync();
            expect(content).toBe(data);
        })
        test('should return null data when file doesn\'t exists', async () => {
            const filename = "data/test2.file";

            const adapter = new AtomicFileAdapter(filename, false);
            const data = await adapter.readAsync();
            expect(data).toBeNull();

        })
        describe('Json', () => {
            test('should be able to write then read to a file', async () => {
                const filename = "data/test.json";
                const data = {Hello: "World", Foo: "Bar"};

                const adapter = new JsonAdapter(new AtomicFileAdapter(filename, false), false);
                await adapter.writeAsync(data);
                const exists = await checkFileExists(filename);
                expect(exists).toBeTruthy();
                const content = await adapter.readAsync();
                expect(content.Hello).toBe("World")
                expect(content.Foo).toBe("Bar");
            })
            test('should create file when loading if it doesn\'t exists', async () => {
                const filename = "data/test.json";
                const adapter = new JsonAdapter(new AtomicFileAdapter(filename, false), false);
                await adapter.readAsync();

                const fileExists = await checkFileExists(filename);
                expect(fileExists).toBeTruthy();

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
