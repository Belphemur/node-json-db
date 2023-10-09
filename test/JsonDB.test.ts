import {JsonDB} from '../src/JsonDB'

describe('JsonDB', () => {
    let db: JsonDB
    beforeEach(() => {
        db = JsonDB.prototype
    })
    describe('exists()', () => {
        test('should throw error when error is not instance of DataError', () => {
            db.getData = jest.fn(() => {
                throw new Error('error')
            })

            expect(async () => {
                await db.exists('a')
            }).rejects.toThrow('error')
        })
    })
    describe('count()', () => {
        test('should throw path error when path not found', () => {
            db.getData = jest.fn(async () => {
                'a'
            })
            expect(async () => {
                await db.count('a')
            }).rejects.toThrow('DataPath: a is not an array.')
        })
    })
    describe('getArrayData()', () => {
        test('should throw path error when path not found', () => {
            db.getData = jest.fn(async () => {
                'a'
            })
            expect(async () => {
                await db['getArrayData']('a')
            }).rejects.toThrow('DataPath: a is not an array.')
        })
    })
    describe('filter()', () => {
        test('should return undefined when not found', async () => {
            db.getData = jest.fn(async () => ({
                a: 1,
                b: 2,
            }))
            const result = await db.filter<{ test: string }>(
                '/filter/data',
                (entry) => entry.test === 'echo'
            )
            expect(result).toBeUndefined()
        })
        test('should return undefined when found length < 1', async () => {
            db.getData = jest.fn(async () => ({
                a: 1,
                b: 2,
            }))
            const result = await db.filter<{ a: string }>('/a', (entry) => entry.c === 1)
            expect(result).toBeUndefined()
        })
        test('should throw path error when path not found', () => {
            db.getData = jest.fn(async () => 1)
            expect(async () => {
                await db.filter<{ a: string }>('/a', (entry) => entry.c === 1)
            }).rejects.toThrow(
                'The entry at the path (/a) needs to be either an Object or an Array'
            )
        })
    })

    describe('find()', () => {
        test('should return undefined when not found', async () => {
            db.getData = jest.fn(async () => ({
                a: 1,
                b: 2,
            }))
            const result = await db.find<{ test: string }>(
                '/filter/data',
                (entry) => entry.test === 'echo'
            )
            expect(result).toBeUndefined()
        })
        test('should return undefined when found length < 1', async () => {
            db.getData = jest.fn(async () => ({
                a: 1,
                b: 2,
            }))
            const result = await db.find<{ a: string }>('/a', (entry) => entry.c === 1)
            expect(result).toBeUndefined()
        })
        test('should throw path error when path not found', () => {
            db.getData = jest.fn(async () => 1)
            expect(async () => {
                await db.find<{ a: string }>('/a', (entry) => entry.c === 1)
            }).rejects.toThrow(
                'The entry at the path (/a) needs to be either an Object or an Array'
            )
        })
    })

    describe('toPath()', () => {
        test('should throw path error when not found item',() => {
            db.getData = jest.fn(async () => ({
                a: [
                    {
                        id: '1'
                    }
                ]
            }))

            expect(async () => {
                await db.toPath('/a/1')
            }).rejects.toThrow(
                'DataPath: /a/1 not found.'
            )
        })
    })

    // Test was made for code coverage for getParentData, but this cannot return null or undefined.
    // Commented out the test and the checks in JsonDB.ts.
    // describe('push()', () => {
    //   test('', () => {
    //     db['getParentData'] = jest.fn(() => {
    //       return DBParentData.prototype
    //     })
    //   })
    // })

    describe('save()', () => {
        test('should throw exception when save fails', () => {
            expect(async () => {
                await db.save(true)
            }).rejects.toThrow("Can't save the database")
        })
    })
})
