import { JsonDB } from '../src/JsonDB'
import { Config } from "../src/lib/JsonDBConfig"

describe('JsonDB', () => {
    describe('check existing database file', () => {
        let db
        beforeEach(() => {
            db = new JsonDB(new Config('test/game_file', false, true));
        })
        test('should contains data', async () => {
            const role = { name: 'test:' }
            expect(await db.getData(`/${role.name}`)).toBe('488722677205303327')
        })

        test('should delete data', async () => {
            await db.push('/deleteme:', 'abc')
            const role = { name: 'deleteme:' }
            await db.delete(`/${role.name}`)
            expect(await db.exists(`/${role.name}`)).toBeFalsy()
        })

    })
})