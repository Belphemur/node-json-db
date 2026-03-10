import {FileAdapter} from "../../src/adapter/file/FileAdapter";
import * as fs from "fs";
import * as fsPromise from 'node:fs/promises'
import {JsonAdapter} from "../../src/adapter/data/JsonAdapter";
import {IAdapter} from "../../src/adapter/IAdapter";
import {ConfigWithAdapter} from "../../src/lib/JsonDBConfig";
import {DataError} from "../../src/lib/Errors";
import {defaultSerializers} from "../../src/adapter/data/Serializers";

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

            test('should serialize and deserialize a Set', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    mySet: new Set([1, 2, 3])
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.mySet).toBeInstanceOf(Set);
                expect(readObject.mySet.size).toBe(3);
                expect(readObject.mySet.has(1)).toBe(true);
                expect(readObject.mySet.has(2)).toBe(true);
                expect(readObject.mySet.has(3)).toBe(true);
            })

            test('should serialize and deserialize a Map', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    myMap: new Map<string, number>([["a", 1], ["b", 2]])
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.myMap).toBeInstanceOf(Map);
                expect(readObject.myMap.size).toBe(2);
                expect(readObject.myMap.get("a")).toBe(1);
                expect(readObject.myMap.get("b")).toBe(2);
            })

            test('should serialize and deserialize a RegExp', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    pattern: /hello\s+world/gi
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.pattern).toBeInstanceOf(RegExp);
                expect(readObject.pattern.source).toBe("hello\\s+world");
                expect(readObject.pattern.flags).toBe("gi");
            })

            test('should serialize and deserialize a BigInt', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    big: BigInt("9007199254740993")
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(typeof readObject.big).toBe("bigint");
                expect(readObject.big).toBe(BigInt("9007199254740993"));
            })

            test('should serialize and deserialize an empty Set', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    emptySet: new Set()
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.emptySet).toBeInstanceOf(Set);
                expect(readObject.emptySet.size).toBe(0);
            })

            test('should serialize and deserialize an empty Map', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    emptyMap: new Map()
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.emptyMap).toBeInstanceOf(Map);
                expect(readObject.emptyMap.size).toBe(0);
            })

            test('should serialize and deserialize nested complex types', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    mySet: new Set(["a", "b"]),
                    myMap: new Map<string, any>([
                        ["key1", new Set([10, 20])],
                        ["key2", "plain value"]
                    ]),
                    myDate: new Date(),
                    hello: "world"
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.mySet).toBeInstanceOf(Set);
                expect(readObject.mySet.has("a")).toBe(true);
                expect(readObject.myMap).toBeInstanceOf(Map);
                expect(readObject.myMap.get("key1")).toBeInstanceOf(Set);
                expect(readObject.myMap.get("key1").has(10)).toBe(true);
                expect(readObject.myMap.get("key2")).toBe("plain value");
                expect(readObject.myDate).toBeInstanceOf(Date);
                expect(readObject.hello).toBe("world");
            })

            test('should preserve objects with __type that do not match any serializer', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    custom: {__type: "UnknownType", __value: "some data"}
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.custom.__type).toBe("UnknownType");
                expect(readObject.custom.__value).toBe("some data");
            })

            test('should support custom serializers alongside defaults', async () => {
                class Url {
                    constructor(public href: string) {}
                    toString() { return this.href; }
                }
                const urlSerializer = {
                    type: "URL",
                    serialize: (value: Url) => value.href,
                    deserialize: (value: string) => new Url(value),
                    test: (value: any) => value instanceof Url,
                };
                const adapter = new JsonAdapter(new MemoryAdapter(), false, [...defaultSerializers, urlSerializer]);
                const data = {
                    link: new Url("https://example.com"),
                    tags: new Set(["a", "b"]),
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.link).toBeInstanceOf(Url);
                expect(readObject.link.href).toBe("https://example.com");
                expect(readObject.tags).toBeInstanceOf(Set);
                expect(readObject.tags.has("a")).toBe(true);
            })

            test('should serialize Set with string values in human-readable format', async () => {
                const memAdapter = new MemoryAdapter();
                const adapter = new JsonAdapter(memAdapter, true);
                const data = {
                    tags: new Set(["typescript", "json"])
                }

                await adapter.writeAsync(data);
                const raw = await memAdapter.readAsync();
                expect(raw).toContain('"__type": "Set"');
                expect(raw).toContain('"__value"');

                const readObject = await adapter.readAsync();
                expect(readObject.tags).toBeInstanceOf(Set);
                expect(readObject.tags.has("typescript")).toBe(true);
            })

            test('should serialize and deserialize all built-in types together', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    date: new Date("2023-06-15T12:00:00.000Z"),
                    set: new Set([1, "two", 3]),
                    map: new Map<string, any>([["x", 10], ["y", new Date("2020-01-01")]]),
                    regex: /^test$/i,
                    bigint: BigInt("12345678901234567890"),
                    plain: "hello",
                    num: 42,
                    bool: true,
                    nil: null,
                }

                await adapter.writeAsync(data);
                const result = await adapter.readAsync();
                expect(result.date).toBeInstanceOf(Date);
                expect(result.date.toISOString()).toBe("2023-06-15T12:00:00.000Z");
                expect(result.set).toBeInstanceOf(Set);
                expect(result.set.size).toBe(3);
                expect(result.map).toBeInstanceOf(Map);
                expect(result.map.get("y")).toBeInstanceOf(Date);
                expect(result.regex).toBeInstanceOf(RegExp);
                expect(result.regex.test("TEST")).toBe(true);
                expect(typeof result.bigint).toBe("bigint");
                expect(result.bigint).toBe(BigInt("12345678901234567890"));
                expect(result.plain).toBe("hello");
                expect(result.num).toBe(42);
                expect(result.bool).toBe(true);
                expect(result.nil).toBeNull();
            })

            test('should escape user data that has __type matching a serializer name', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    custom: {__type: "Set", __value: [1, 2, 3]}
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.custom.__type).toBe("Set");
                expect(readObject.custom.__value).toEqual([1, 2, 3]);
                expect(readObject.custom).not.toBeInstanceOf(Set);
            })

            test('should escape nested user data with __type properties', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    outer: {
                        inner: {__type: "Map", __value: "not really a map"},
                        real: new Set([1, 2])
                    }
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.outer.inner.__type).toBe("Map");
                expect(readObject.outer.inner.__value).toBe("not really a map");
                expect(readObject.outer.real).toBeInstanceOf(Set);
                expect(readObject.outer.real.has(1)).toBe(true);
            })

            test('should escape user data with __type that is a non-string value', async () => {
                const adapter = new JsonAdapter(new MemoryAdapter(), false);
                const data = {
                    custom: {__type: 42, extra: "data"}
                }

                await adapter.writeAsync(data);
                const readObject = await adapter.readAsync();
                expect(readObject.custom.__type).toBe(42);
                expect(readObject.custom.extra).toBe("data");
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

        test('should add custom serializer via addSerializer', async () => {
            const {Config} = require("../../src/lib/JsonDBConfig");
            class Url {
                constructor(public href: string) {}
            }
            const urlSerializer = {
                type: "URL",
                serialize: (value: Url) => value.href,
                deserialize: (value: string) => new Url(value),
                test: (value: any) => value instanceof Url,
            };
            const config = new Config('/tmp/test-serializer');
            config.addSerializer(urlSerializer);
            await config.adapter.writeAsync({link: new Url("https://example.com"), tags: new Set(["a"])});
            const result = await config.adapter.readAsync();
            expect(result.link).toBeInstanceOf(Url);
            expect(result.link.href).toBe("https://example.com");
            expect(result.tags).toBeInstanceOf(Set);
            try { fs.rmSync("/tmp/test-serializer.json"); } catch {}
        });
    });
});
