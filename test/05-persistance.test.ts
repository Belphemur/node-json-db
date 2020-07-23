import { JsonDB } from '../src/JsonDB'
import { KeyValue } from '../src/lib/Utils'
import { DatabaseError } from '../src/lib/Errors'

describe('JsonDB', () => {

    describe('no save at all', () => {
        const db = new JsonDB(null, false, true)

        test('should ignore persistance', () => {
            db.push('/test', 'abc')
            const data = db.getData()
            expect(data).toHaveProperty('test')
        })
    })

    describe('custom saving method', () => {
        let saved: KeyValue;

        const db = new JsonDB(null, true, true, '/', data => {
            // custom saving method
            saved = data
        })

        test('should execute a custom saving method on push', () => {
            db.push('/automatic', 'abc')
            expect(saved).toHaveProperty('automatic')
        })

        test('should trigger the custom saving method', () => {
            db.push('/manual', 'abc')
            db.save()
            expect(saved).toHaveProperty('manual')
        })
    })

    test('should throw an error when trying to save without a custom saving method', () => {
        const db = new JsonDB(null, false, true)
        
        try {
            (function () {
                db.save()
            })()

            throw Error('Function did not throw')
        } catch (e) {
            expect(e).toBeInstanceOf(DatabaseError)
            expect(e).toHaveProperty('id', 2)
        }
    })
})