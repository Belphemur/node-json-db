import {AtomicFileAdapter} from "../../src/adapter/file/AtomicFileAdapter";
import * as fs from "fs";
import {DirectoryAdapter} from "../../dist/adapter/file/DirectoryAdapter";
import {JsonAdapter} from "../../dist/adapter/data/JsonAdapter";

function checkFileExists(file: string): Promise<boolean> {
    return fs.promises.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
}

describe('Adapter', () => {
    describe('Atomic', () => {
        test('should be able to write then read to a file', async () => {
            const filename = "data/test.file";
            const data = "Hello World";

            const adapter = new AtomicFileAdapter(filename);
            await adapter.writeAsync(data);
            const exists = await checkFileExists(filename);
            expect(exists).toBeTruthy();
            const content = await adapter.readAsync();
            expect(content).toBe(data);
        })
        test('should return null data when file doesn\'t exists', async () => {
            const filename = "data/test2.file";

            const adapter = new AtomicFileAdapter(filename);
            const data = await adapter.readAsync();
            expect(data).toBeNull();

        })
        describe('Json', () => {
            test('should be able to write then read to a file', async () => {
                const filename = "data/test.json";
                const data = {Hello: "World", Foo: "Bar"};

                const adapter = new JsonAdapter(new AtomicFileAdapter(filename), false);
                await adapter.writeAsync(data);
                const exists = await checkFileExists(filename);
                expect(exists).toBeTruthy();
                const content = await adapter.readAsync();
                expect(content.Hello).toBe("World")
                expect(content.Foo).toBe("Bar");
            })
            test('should create file when loading if it doesn\'t exists', async () => {
                const filename = "data/test.json";
                const adapter = new JsonAdapter(new AtomicFileAdapter(filename), false);
                await adapter.readAsync();

                const fileExists = await checkFileExists(filename);
                expect(fileExists).toBeTruthy();

            })
        })
    });
});
