import { JsonDB } from '../src/JsonDB'

describe('JsonDB', () => {
    const db = new JsonDB('test/game_file', true, true)
    describe('check existing database file', () => {
        test('should contains data', () => {
            const role = {name: 'test:'}
            expect(db.getData(`/${role.name}`)).toBe('488722677205303327')
        })

        test('should delete data', () => {
            db.push('/deleteme:', 'abc')
            const role = {name: 'deleteme:'}
            db.delete(`/${role.name}`)
            expect(db.exists(`/${role.name}`)).toBeFalsy()
        })

    })
})