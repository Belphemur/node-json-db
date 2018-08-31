import {ArrayInfo, arrayRegex} from "../src/lib/ArrayInfo"
import {DataError} from "../src/lib/Errors"

const SafeRegex = require('safe-regex')

describe('Utils', () => {

    describe('Array regex', () => {
        test('should be safe', () => {
            expect(SafeRegex(arrayRegex())).toBeTruthy()
        })
    })

    describe('Process Array', () => {
        test('should not process a not well formatted array', () => {
            expect(ArrayInfo.processArray('array[[]')).toBe(null)
        })

        test('should process array with numerical key', () => {
            const arrayInfo = ArrayInfo.processArray('array[0]')
            expect(arrayInfo).toBeInstanceOf(ArrayInfo)
            expect(arrayInfo).toHaveProperty('property', 'array')
            expect(arrayInfo).toHaveProperty('append', false)
            expect(arrayInfo).toHaveProperty('index', 0)
        })

        test('should process array append', () => {
            const arrayInfo = ArrayInfo.processArray('array[]')
            expect(arrayInfo).toBeInstanceOf(ArrayInfo)
            expect(arrayInfo).toHaveProperty('property', 'array')
            expect(arrayInfo).toHaveProperty('append', true)
            expect(arrayInfo).toHaveProperty('index', 0)
        })

        test('should process array -1', () => {
            const arrayInfo = ArrayInfo.processArray('array[-1]')
            expect(arrayInfo).toBeInstanceOf(ArrayInfo)
            expect(arrayInfo).toHaveProperty('property', 'array')
            expect(arrayInfo).toHaveProperty('append', false)
            expect(arrayInfo).toHaveProperty('index', -1)
        })

        test('should use the cache', () => {
            const arrayInfo = ArrayInfo.processArray('info[0]')

            expect(arrayInfo).toBeInstanceOf(ArrayInfo)
            expect(arrayInfo).toHaveProperty('property', 'info')
            expect(arrayInfo).toHaveProperty('append', false)
            expect(arrayInfo).toHaveProperty('index', 0)

            const arrayInfoSame = ArrayInfo.processArray('info[0]')

            expect(arrayInfo).toBe(arrayInfoSame)

        })

        test('should not process array with string key', () => {
            try {
                (function (args) {
                    ArrayInfo.processArray(args)
                })("test[test]")

                throw Error('Function did not throw')
            } catch (e) {
                expect(e).toBeInstanceOf(DataError)
                expect(e.id).toBe(200)
            }
        })

        test('should ignore an empty argument', () => {
            const arrayInfo = ArrayInfo.processArray(undefined)
            expect(arrayInfo).toBe(null)
        })

    })

})