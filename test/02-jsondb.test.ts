import { DatabaseError, DataError } from "../src/lib/Errors"
import { JsonDB } from "../src/JsonDB"
import * as fs from 'fs'
import { Config } from "../src/lib/JsonDBConfig"
import { writeLockAsync } from "../src/lock/Lock";
import { TimeoutError } from "../src/lock/Error";
import { readFile, open, FileHandle, mkdir } from "fs/promises";


const testFile = "test/test"

interface Test {
    Hello: string
    World: number
}
describe('JsonDB', () => {
    afterEach(() => {
        try {
            fs.rmSync(testFile + ".json")
        }
        catch (e) {
            console.log(e)
        }

    })
    describe('Exception/Error', () => {
        test('should create create a DataError', () => {
            const error = new DataError("Test", 5)
            expect(error).toHaveProperty("message", "Test")
            expect(error).toHaveProperty("id", 5)
            expect(error).toHaveProperty("inner", undefined)
            expect(error.toString()).toEqual("DataError: Test")
        })
        test('should create create a DatabaseError', () => {
            const nested = new Error("don't work")
            const error = new DatabaseError("Test", 5, nested)
            expect(error).toHaveProperty("message", "Test")
            expect(error).toHaveProperty("id", 5)
            expect(error).toHaveProperty("inner", nested)
            expect(error.toString()).toEqual("DatabaseError: Test:\nError: don't work")
        })
    })
    describe('Initialisation', () => {
        let db: JsonDB

        beforeEach(() => {
        })

        test('should not create the JSON File', done => {
            db = new JsonDB(new Config(testFile, true, true))
            expect.assertions(1);
            fs.access(testFile + ".json", fs.constants.R_OK, function (err) {
                expect(err).not.toBeNull();
                done()
            })
        })

        test('should set en empty root', async () => {
            db = new JsonDB(new Config(testFile, true, true))
            expect.assertions(1);
            expect(JSON.stringify(await db.getData("/"))).toEqual("{}")
        })

        describe('Errors', () => {
            beforeEach(async () => {
                //TODO create the file
                const fd = await open(testFile + '.json', 'w');
                console.log(fd)
                await fd.writeFile('{ ', {
                    encoding: 'utf-8'
                })
                await fd.close();
                db = new JsonDB(new Config(testFile, true))
            })
            test('should return a DatabaseError when loading faulty file', async () => {
                try {
                    await db.getData('/')
                } catch (e) {
                    expect(e).toBeInstanceOf(DatabaseError)
                }
            })

            test('should return a DatabaseError when saving without successful loading.', async () => {
                try {
                    await db.save()
                    throw Error('Function did not throw')
                } catch (e) {
                    expect(e).toBeInstanceOf(DatabaseError)
                }
            }
            )
        })

    })
    describe('Data Management', () => {
        let db: JsonDB

        beforeEach(() => {
            const config = new Config(testFile)
            config.separator = '@'
            db = new JsonDB(config)
        })

        test('should store the data at the root', async () => {
            expect.assertions(1);
            const object = { test: { test: "test" } }
            await db.push("@", object)
            expect(await db.getData("@")).toBe(object)
        })

        test('should store the data with typing', async () => {
            expect.assertions(1);
            const object = { Hello: "test", World: 0 } as Test;
            await db.push("@/hello", object)
            const result = await db.getObject<Test>("@/hello");
            expect(result).toBe(object)
        })

        test('should store the data with typing and default', async () => {
            expect.assertions(1);
            const object = { Hello: "test", World: 0 } as Test;
            await db.push("@lol@test", object)
            const result = await db.getObjectDefault<Test>("@lol@test");
            expect(result).toBe(object)
        })

        test('should get default value when not finding path', async () => {
            expect.assertions(1);
            const result = await db.getObjectDefault<string>("@lol@test@nah", "defaultValue");
            expect(result).toBe("defaultValue")
        })

        test('should get exception when not the right data type', async () => {
            expect.assertions(1);
            const object = { Hello: "test", World: 0 } as Test;
            await db.push("@lol@test", object)
            await expect(async () => await db.getObjectDefault<string>("@lol@test[0]", "defaultValue")).rejects.toThrow(DataError)
        })

        test('should have data at root', async () => {
            const object = { test: { test: "test" } }
            await db.push("@", object)
            expect(await db.exists('@test@test')).toBeTruthy()
        })

        test('should not have data at not related path', async () => {
            const object = { test: { test: "test" } }
            await db.push("@", object)
            expect(await db.exists('@test@test@nope')).toBeFalsy()
        })

        test('should override the data at the root', async () => {
            await db.push("@", { test: { test: "test" } })
            const object = { test: "test" }
            await db.push("@", object)
            expect(await db.getData("@")).toBe(object)
        })

        test('should merge the data at the root', async () => {
            let object = { test: { test: ['Okay'] } } as any
            await db.push("@", object)
            const data = await db.getData("@")
            expect(data).toBe(object)
            object = { test: { test: ['Perfect'], okay: "test" } } as any
            await db.push("@", object, false)
            expect(JSON.stringify(await db.getData("@"))).toEqual('{\"test\":{\"test\":[\"Okay\",\"Perfect\"],\"okay\":\"test\"}}')
        })

        test('should return right data for dataPath', async () => {
            let object = { test: { test: ['Okay'] } } as any
            await db.push("@", object)
            object = { test: { test: ['Perfect'], okay: "test" } } as any
            await db.push("@", object, false)
            const data = await db.getData("@test")
            expect(JSON.stringify(data)).toEqual('{"test":["Okay","Perfect"],"okay":"test"}')
        })

        test('should override only the data at dataPath', async () => {
            const object = ['overriden']
            await db.push("@test@test", object)
            expect(await db.getData("@test@test")).toBe(object)
        })
        test('should remove trailing @ when pushing data', async () => {
            const object = { test: { test: "test" } }
            await db.push("@testing@", object)
            expect(await db.getData("@testing")).toBe(object)
        })

        test('should remove trailing @ when deleting data', async () => {
            expect.assertions(1);
            const object = { test: { test: "test" } }
            await db.push("@testing@", object)
            await db.delete("@testing@")
            try {
                await db.getData('@testing')
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
            }
        })

        test('should merge the data at dataPath', async () => {
            await db.push("@test@test", ['overriden'])
            await db.push("@test@test", ['test2'], false)
            expect(JSON.stringify(await db.getData("@test@test"))).toEqual('[\"overriden\",\"test2\"]')
        })

        test('should create the tree to reach dataPath', async () => {
            const object = ['test2']
            await db.push("@my@tree@is@awesome", object, false)
            expect(JSON.stringify(await db.getData("@my@tree@is@awesome"))).toEqual('[\"test2\"]')
        })

        test('should throw an Error when merging Object with Array', async () => {
            expect.assertions(1);
            try {
                await db.push("@test@test", ['overriden'])
                await db.push("@test@test", { myTest: "test" }, false)
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
            }
        })

        test('should override a null constiable when merging', async () => {
            const replacement = { a: 'test' }
            await db.push('@null', { a: null }, false)
            await db.push('@null', replacement, false)
            const data = await db.getData('@null')
            expect(data['a']).toBe(replacement['a'])
        })

        test('should throw an Error when merging Array with Object', async () => {
            try {
                await db.push("@test", { test: ['Perfect'], okay: "test" })
                await db.push("@test", ['test'], false)
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
            }
        })

        test('should throw an Error when asking for empty dataPath', async () => {
            try {
                await db.getData("")
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
            }
        })

        test('should delete the data', async () => {
            await db.push("@test@test", { test: ['Perfect'], okay: "test" })
            await db.delete("@test@test")
            try {
                await db.getData("@test@test")
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
            }
        })

        test('should reload the file', async () => {
            expect.assertions(2);
            const data = JSON.stringify({ test: "Okay", perfect: 1 })
            fs.writeFileSync(testFile + ".json", data, 'utf8')
            await db.reload()
            expect(await db.getData("@test")).toBe("Okay")
            expect(await db.getData("@perfect")).toBe(1)
        })
    })
    describe('Human Readable', () => {
        let db: JsonDB
        beforeEach(() => {
            db = new JsonDB(new Config(testFile, true, true))
        })

        test('should save the data in an human readable format', async () => {
            const object = { test: { readable: "test" } }
            await db.push("/", object)
            const data = await fs.promises.readFile(testFile + ".json", "utf8");
            expect(data).toBe(JSON.stringify(object, null, 4))
        })
    })
    describe('Array Support', () => {
        let db: JsonDB
        beforeEach(() => {
            db = new JsonDB(new Config(testFile, true))
        })
        test('should create an array with a string at index 0', async () => {
            await db.push('/arraytest/myarray[0]', "test", true)
            const myarray = await db.getData('/arraytest/myarray')
            expect(myarray).toBeInstanceOf(Array)
            expect(myarray[0]).toBe('test')
        })

        test('should add array entry of array using dash (-) in name', async () => {
            await db.push('/arraytest/my-array[0]', "test", true)
            const myarray = await db.getData('/arraytest/my-array')
            expect(myarray).toBeInstanceOf(Array)
            expect(myarray[0]).toBe('test')
        })
        test('should throw an Error when using an array with a string at index TEST', async () => {
            expect.assertions(2);
            try {
                await db.push('/arraytest/myarray[TEST]', "works", true)
                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e).toHaveProperty('id', 200)
            }
        })

        test('should add an object at index 1', async () => {
            const obj = { property: "perfect" }
            await db.push('/arraytest/myarray[1]', obj, true)
            const myarray = await db.getData('/arraytest/myarray')
            expect(myarray).toBeInstanceOf(Array)
            expect(myarray[1]).toBe(obj)
        })

        test('should create a nested array with an object at index 0', async () => {
            const data = { test: "works" }
            await db.push('/arraytest/nested[0]/obj', data, true)
            const obj = await db.getData('/arraytest/nested[0]')
            expect(typeof obj).toBe('object')
            expect(obj).toHaveProperty('obj', data)
        })

        test('should access the object at index 1', async () => {
            await db.push('/arraytest/myarray[0]', "test", true)
            await db.push('/arraytest/myarray[1]', { property: "perfect" }, true)
            const obj = await db.getData('/arraytest/myarray[1]')
            expect(typeof obj).toBe('object')
            expect(obj).toHaveProperty('property', 'perfect')

        })
        test('should access the object property at index 1', async () => {
            await db.push('/arraytest/myarray[0]', "test", true)
            await db.push('/arraytest/myarray[1]', { property: "perfect" }, true)
            const property = await db.getData('/arraytest/myarray[1]/property')
            expect(typeof property).toBe('string')
            expect(property).toBe('perfect')
        })

        test('should throw an error when accessing non-present index', async () => {
            const obj = { property: "perfect" }
            await db.push('/arraytest/arrayTesting[0]', obj, true)
            try {
                const wat = await db.getData("/arraytest/arrayTesting[1]")
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e).toHaveProperty('id', 10)
            }
        })

        test('should delete the object at index 1', async () => {
            await db.push('/arraytest/myarray[0]', "test", true)
            await db.push('/arraytest/myarray[1]', { property: "perfect" }, true)
            await db.delete('/arraytest/myarray[1]')
            try {
                let d = await db.getData("/arraytest/myarray[1]")
                console.log(d)
                // throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e).toHaveProperty('id', 10)
            }
        })

        test('should throw an error when deleting non-present index', async () => {
            try {
                await (async function (args) {
                    await db.delete(args)
                })("/arraytest/myarray[10]")

                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e).toHaveProperty('id', 10)
            }
        })

        test(
            'should throw an error when trying to set an object as an array',
            async () => {
                await db.push('/arraytest/fakearray', { fake: "fake" }, true)

                try {
                    await (async function (args) {
                        await db.push(args, { test: 'test' }, true)
                    })("/arraytest/fakearray[1]")

                    throw Error('Function did not throw')
                } catch (e) {
                    expect(e).toBeInstanceOf(DataError)
                    expect(e).toHaveProperty('id', 11)
                }
            }
        )

        test(
            'should throw an error when trying to access an object as an array',
            async () => {
                await db.push('/arraytest/fakearray', { fake: "fake" }, true)

                try {
                    await (async function (args) {
                        await db.getData(args)
                    })('/arraytest/fakearray[1]')

                    throw Error('Function did not throw')
                } catch (e) {
                    expect(e).toBeInstanceOf(DataError)
                    expect(e).toHaveProperty('id', 11)
                }
            }
        )
        test(
            'should throw an error when trying to set an object as an array (2)',
            async () => {
                await db.push('/arraytest/fakearray', { fake: "fake" }, true)

                try {
                    await (async function (args) {
                        await db.push(args, { test: 'test' }, true)
                    })('/arraytest/fakearray[1]/fake')

                    throw Error('Function did not throw')
                } catch (e) {
                    expect(e).toBeInstanceOf(DataError)
                    expect(e).toHaveProperty('id', 11)
                }
            }
        )

        test('should merge nested arrays', async () => {
            await db.push('/merging/array[0]', ['test'])
            await db.push('/merging/array[0]', ['secondTest'], false)
            const data = await db.getData('/merging/array[0]')
            expect(data).toBeInstanceOf(Array)
            expect(data).toContain('test')
            expect(data).toContain('secondTest')
        })

        test('should remove the index of an array, not set it to null', async () => {
            await db.push('/deleteTest/array[0]', 'test')
            await db.push('/deleteTest/array[1]', 'test2')
            await db.delete('/deleteTest/array[1]')
            await db.save(true)
            // @ts-ignore
            const json = JSON.parse(fs.readFileSync(testFile + '.json'))
            expect(typeof json.deleteTest).toBe('object')
            expect(json.deleteTest.array).toBeInstanceOf(Array)
            expect(json.deleteTest.array[0]).toBe('test')
            expect(json.deleteTest.array[1]).toBe(undefined)
        })

        test('should append a value to the existing array', async () => {
            await db.push('/arraytest/appendArray', [0], true)
            await db.push('/arraytest/appendArray[]', 1, true)
            const array = await db.getData('/arraytest/appendArray')
            expect(array).toBeInstanceOf(Array)
            const index1 = await db.getData('/arraytest/appendArray[1]')
            expect(index1).toBe(1)
        })

        test('should throw an error when deleting a append command', async () => {
            try {
                await (async function (args) {
                    await db.delete(args)
                })('/arraytest/appendArray[]')

                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e).toHaveProperty('id', 10)
            }
        })

        test(
            'should append a value to the existing array and create property',
            async () => {
                await db.push('/arrayAppend/mySuperArray', [0], true)
                await db.push('/arrayAppend/mySuperArray[]/test', 1, true)
                const array = await db.getData('/arrayAppend/mySuperArray')
                expect(array).toBeInstanceOf(Array)
                const index1 = await db.getData('/arrayAppend/mySuperArray[1]/test')
                expect(index1).toBe(1)
            }
        )

        //issue #571
        test(
            'should have no issue with numerical property for getting data in an array',
            async () => {
                await db.push('/issue571/1[]', "Hello", true)
                await db.push('/issue571/1[]', "world", true)
                let data = await db.getObject("/issue571/1[0]");
                expect(data).toBe("Hello");
                data = await db.getObject("/issue571/1[-1]");
                expect(data).toBe("world");

            }
        )

        test(
            'should throw an error when trying to append to a non array',
            async () => {
                await db.push('/arraytest/fakearray', { fake: "fake" }, true)

                try {
                    await (async function (args) {
                        await db.push(args, { test: 'test' }, true)
                    })('/arraytest/fakearray[]/fake')

                    throw Error('Function did not throw')
                } catch (e) {
                    expect(e).toBeInstanceOf(DataError)
                    expect(e).toHaveProperty('id', 11)
                }
            }
        )
        test('should add array entry of array starting with number in name', async () => {
            await db.push('/arraytest/11_Dec[0]', "test", true)
            const myarray = await db.getData('/arraytest/11_Dec')
            expect(myarray).toBeInstanceOf(Array)
            expect(myarray[0]).toBe('test')
        })
        test('should add array entry of array containg a dot (.) in name', async () => {
            await db.push('/arraytest/d.s_[0]', "test", true)
            const myarray = await db.getData('/arraytest/d.s_')
            expect(myarray).toBeInstanceOf(Array)
            expect(myarray[0]).toBe('test')
        })
        describe('last item', () => {

            test(
                'should throw an exception when array is empty when using -1',
                async () => {
                    await db.push('/arraylast/myarrayempty', [], true)

                    try {
                        await (async function (args) {
                            await db.getData(args)
                        })('/arraylast/myarrayempty[-1]')

                        throw Error('Function did not throw')
                    } catch (e) {
                        expect(e).toBeInstanceOf(DataError)
                        expect(e).toHaveProperty('id', 10)
                    }
                }
            )

            test('should set the fist item when using -1 on empty array', async () => {
                await db.push('/arraylast/emptyArray', [], true)
                await db.push('/arraylast/emptyArray[-1]', 3)
                const lastItem = await db.getData('/arraylast/emptyArray[0]')
                expect(lastItem).toBe(3)
            })

            test('should return the last key when using -1', async () => {
                await db.push('/arraylast/myarray', [1, 2, 3], true)
                const lastItem = await db.getData('/arraylast/myarray[-1]')
                expect(lastItem).toBe(3)
            })
            test('should replace the last item when using -1', async () => {
                await db.push('/arraylast/a1', [1, 2, 3], true)
                await db.push('/arraylast/a1[-1]', 5)
                const lastItem = await db.getData('/arraylast/a1[-1]')
                expect(lastItem).toBe(5)
            })
            test('should delete the last item when using -1', async () => {
                await db.push('/arraylast/a2', [1, 2, 3], true)
                await db.delete('/arraylast/a2[-1]')
                const lastItem = await db.getData('/arraylast/a2[-1]')
                expect(lastItem).toBe(2)
            })
        })

    })
    describe('Delete Info', () => {
        let db: JsonDB
        beforeEach(() => {
            db = new JsonDB(new Config(testFile, true))
        })
        test('should delete data from memory', async () => {
            await db.push('/test', ['data'])
            await db.delete('/test')
            expect(await db.exists('/test')).toBeFalsy()
        })

        test('should delete the data and save the file if saveOnPush is set', async () => {
            const object = { test: { readable: "test" } }
            await db.push("/", object)
            let data = await fs.promises.readFile(testFile + ".json", "utf8");
            expect(data).toBe(JSON.stringify(object))
            await db.delete('/test')

            data = await fs.promises.readFile(testFile + ".json", "utf8");
            expect(data).toBe(JSON.stringify({}))
        }
        )
    })
    describe('Find Info', () => {
        let db: JsonDB
        beforeEach(() => {
            db = new JsonDB(new Config(testFile, true))
        })

        test('should be able to find the wanted info in object',
            async () => {
                await db.push('/find/id-0', { test: 'hello' })
                await db.push('/find/id-1', { test: 'hey' })
                await db.push('/find/id-2', { test: 'echo' })
                const result = await db.find<string>('/find', entry => entry.test === 'echo')
                expect(result).toBeInstanceOf(Object)
                expect(result).toHaveProperty('test', 'echo')
            })
        test('should be able to find the wanted info in array',
            async () => {
                await db.push('/find/data', [{ test: 'echo' }, { test: 'hey' }, { test: 'hello' }])
                const result = await db.find<string>('/find/data', entry => entry.test === 'hello')
                expect(result).toBeInstanceOf(Object)
                expect(result).toHaveProperty('test', 'hello')
            })
        test('shouldn\'t be able to find a data in anything else than Object or Array',
            async () => {
                await db.push('/find/number', 1)
                expect(async () => await db.find<string>('/find/number', entry => entry.test === 'hello')).rejects.toThrow(DataError)
            })
    })
    describe('Filter Info', () => {
        let db: JsonDB
        beforeEach(() => {
            db = new JsonDB(new Config(testFile, true))
        })

        test('should be able to filter object matching filter', async () => {
            await db.push('/filter/id-0', { test: 'hello' })
            await db.push('/filter/id-1', { test: 'hey' })
            await db.push('/filter/id-2', { test: 'echo' })
            await db.push('/filter/id-3', { test: 'hello' })
            const result = await db.filter<{ test: string }>('/filter', entry => entry.test === 'hello')
            expect(result).toBeInstanceOf(Array)
            expect(result).toHaveLength(2)
            expect(result![0]).toHaveProperty('test', 'hello')
            expect(result![1]).toHaveProperty('test', 'hello')
        })
        test('should be able to filter the array matching filter', async () => {
            await db.push('/filter/data', [{ test: 'echo' }, { test: 'hey' }, { test: 'hello' }, { test: 'echo' }])
            const result = await db.filter<{ test: string }>('/filter/data', entry => entry.test === 'echo')
            expect(result).toBeInstanceOf(Array)
            expect(result).toHaveLength(2)
            expect(result![0]).toHaveProperty('test', 'echo')
            expect(result![1]).toHaveProperty('test', 'echo')
        })
        test('should not be able to find a data in anything else than Object or Array', async () => {
            //expect.assertions(1);
            await db.push('/filter/number', 1)
            //expect(async () => await db.find<{ test: string }>('/filter/number', entry => entry.test === 'hello')).rejects.toThrow(DataError)
        })
    })
})