import {JsonDB} from '../src/JsonDB'
import * as fs from 'fs'
import {Config} from "../src/lib/JsonDBConfig"


describe('Array Utils', () => {
    const db = new JsonDB(new Config('test/recipe', true, true))
    describe('get number of item in an array', () => {
        test('should have the correct count of an array', async () => {
            const recipe_1 = {
                id: 65464646155,
                name: 'Cheesecake',
                category: 'Dessert',
            }
            const recipe_2 = {
                id: 78687873783,
                name: 'Cheeseburger',
                category: 'Dish',
            }
            const recipe_3 = {id: 12335373873, name: 'Soup', category: 'Starter'}
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            expect(await db.count('/recipes')).toBe(3)
        })
    })
    describe('get index of item in an array', () => {
        test('should get the index of the current value', async () => {
            const recipe_1 = {
                id: '65464646155',
                name: 'Cheesecake',
                category: 'Dessert',
            }
            const recipe_2 = {id: '78687873783', name: 'Gratin', category: 'Dish'}
            const recipe_3 = {
                id: '12335373873',
                name: 'Soupe',
                category: 'Starter',
            }
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            expect(await db.getIndex('/recipes', '65464646155')).toBe(0)
            expect(await db.getIndex('/recipes', '78687873783')).toBe(1)
            expect(await db.getIndex('/recipes', '12335373873')).toBe(2)

            await db.delete('/recipes[' + await db.getIndex('/recipes', '78687873783') + ']')

            expect(await db.getIndex('/recipes', '65464646155')).toBe(0)
            expect(await db.getIndex('/recipes', '12335373873')).toBe(1)
        })

        test('should get the index of the current value with anything but id', async () => {
            const recipe_1 = {
                test: '65464646155',
                name: 'Cheesecake',
                category: 'Dessert',
            }
            const recipe_2 = {
                test: '78687873783',
                name: 'Gratin',
                category: 'Dish',
            }
            const recipe_3 = {
                test: '12335373873',
                name: 'Soupe',
                category: 'Starter',
            }
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            expect(await db.getIndex('/recipes', '65464646155', 'test')).toBe(0)
            expect(await db.getIndex('/recipes', '78687873783', 'test')).toBe(1)
            expect(await db.getIndex('/recipes', '12335373873', 'test')).toBe(2)
        })
        test('should get the index of the current value with anything but numerical', async () => {
            const recipe_1 = {
                test: 65464646155,
                name: 'Cheesecake',
                category: 'Dessert',
            }
            const recipe_2 = {test: 78687873783, name: 'Gratin', category: 'Dish'}
            const recipe_3 = {
                test: 12335373873,
                name: 'Soupe',
                category: 'Starter',
            }
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            expect(await db.getIndex('/recipes', 65464646155, 'test')).toBe(0)
            expect(await db.getIndex('/recipes', 78687873783, 'test')).toBe(1)
            expect(await db.getIndex('/recipes', 12335373873, 'test')).toBe(2)
        })

        test('should get the index of an array with string', async () => {
            await db.push('/indexValue[]', 'abc', true)
            await db.push('/indexValue[]', 'def', true)
            await db.push('/indexValue[]', 'gh', true)

            expect(await db.getIndexValue('/indexValue', 'abc')).toBe(0)
            expect(await db.getIndexValue('/indexValue', 'def')).toBe(1)
            expect(await db.getIndexValue('/indexValue', 'gh')).toBe(2)
        })
    })
    describe('Nested array', () => {
        test('get data of a nested array', async () => {
            await db.push('/nested/0/array', [['test', 'test2']], true)
            expect(await db.getData('/nested/0/array[0][0]')).toBe('test')
        })
        test('append data to a nested array', async () => {
            await db.push('/nested/1/array', [['test', 'test2']], true)
            await db.push('/nested/1/array[0][]', 'test3', true)
            expect(await db.getData('/nested/1/array[0][2]')).toBe('test3')
        })
        test('get data of a multiple nested array', async () => {
            await db.push('/nested/0/array', [[['test', 'test2']]], true)
            expect(await db.getData('/nested/0/array[0][0][0]')).toBe('test')
        })
        test('should delete array index at specified position', async () => {
            await db.push('/nested/0/array', [
                ['abc', 'def'],
                ['hij', 'klmn'],
            ])
            await db.delete('/nested/0/array[0][0]')
            expect(await db.getData('/nested/0/array[0][0]')).toBe('def')
        })
        describe('', () => {
            beforeEach(async () => [
                await db.push('/nested/0/array', [
                    [['abc', 'def'], [['hij', 'klmn']]],
                    ['123', '456'],
                    ['789', '100'],
                ]),
            ])
            test('should have the correct counts', async () => {
                // first level
                expect(await db.count('/nested/0/array')).toBe(3)
                // second level
                expect(await db.count('/nested/0/array[0]')).toBe(2)
                expect(await db.count('/nested/0/array[1]')).toBe(2)
                expect(await db.count('/nested/0/array[2]')).toBe(2)
                // third level
                expect(await db.count('/nested/0/array[0][0]')).toBe(2)
                // fourth level
                expect(await db.count('/nested/0/array[0][1][0]')).toBe(2)
            })
            test('should have correct information after delete', async () => {
                const deepestArrayParentQuery = '/nested/0/array[0][1][0]'
                const deepestArrayEntryQuery = `${deepestArrayParentQuery}[0]`
                // validate array value before delete
                expect(await db.getData(deepestArrayEntryQuery)).toBe('hij')

                await db.delete(deepestArrayEntryQuery)
                // validate array value after delete
                expect(await db.count(deepestArrayParentQuery)).toBe(1)
                expect(await db.getData(deepestArrayEntryQuery)).toBe('klmn')
            })

            test('should return the last entry for an array when using -1', async () => {
                // first level
                expect(await db.getData('/nested/0/array[-1][0]')).toBe('789')
                // second level
                expect(await db.getData('/nested/0/array[0][-1]')).toEqual([['hij', 'klmn']])
                // third level
                expect(await db.getData('/nested/0/array[0][-1][-1]')).toEqual([
                    'hij',
                    'klmn',
                ])
                // fourth level
                expect(await db.getData('/nested/0/array[0][-1][-1][-1]')).toBe('klmn')
            })

            test('should delete last entry when using -1', async () => {
                await db.delete('/nested/0/array[0][-1][-1][-1]')
                expect(await db.count('/nested/0/array[0][-1][-1]')).toBe(1)
                expect(await db.getData('/nested/0/array[0][-1][-1][0]')).toBe('hij')
                expect(await db.getData('/nested/0/array[0][-1][-1][1]')).toBeUndefined()
            })

            test('should add to the last entry when using -1', async () => {
                await db.push('/nested/0/array[0][-1][-1][]', 'lastRecord')
                expect(await db.count('/nested/0/array[0][-1][-1]')).toBe(3)
                expect(await db.getData('/nested/0/array[0][-1][-1][2]')).toBe('lastRecord')
            })
        })
    })
    describe('Nested array regex', () => {
        // Test added to play with the regex
        test('should find index for nested array', async () => {
            const arrayRegex = () => /^([\.0-9a-zA-Z_$\-][0-9a-zA-Z_\-$\.]*)(.*)/gm
            const arrayIndexRegex = arrayRegex()
            const match = arrayIndexRegex.exec('array[1][2]')
            let property = ''
            let nestedArrayIndicies = [] as any[]
            if (match != null && match[2]) {
                // Match 1 = property name
                // Match 2 = Array or Nested Arrays
                property = match[1]
                const nestedArrayMatches = match[2].toString()
                nestedArrayIndicies = [
                    // matchAll to support [5] and []
                    ...nestedArrayMatches.matchAll(/\[(.*?)\]/g),
                ].map((match) => match[1])
            }
            expect(property).toBe('array')
            expect(nestedArrayIndicies[0]).toEqual('1')
            expect(nestedArrayIndicies[1]).toEqual('2')
        })
    })
    describe('To router path style to normal path', () => {
        test('should convert a router style path to a normal path', async () => {
            const recipe_1 = {
                id: '78687873783', 
                name: 'Gratin', 
                category: 'Dish',
            }
            const recipe_2 = {
                id: '65464646155',
                name: 'Cheesecake',
                category: 'Dessert',
                nested: [
                    {
                        id: '458445',
                        name: 'test-1',
                    },
                    {
                        id: '88488',
                        name: 'test-2',
                    },
                    {
                        id: '458455',
                        name: 'test-3',
                    },
                ],
            }
            const recipe_3 = {
                id: '12335373873',
                name: 'Soupe',
                category: 'Starter',
            }
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            const routerPathStyle = '/recipes/65464646155/nested/88488'

            const normalPath = await db.toPath(routerPathStyle)

            expect(normalPath).toEqual('/recipes[1]/nested[1]')
        })
        test('should convert a router style path to a normal path using other propertyName', async () => {
            const recipe_1 = {
                _id: '78687873783', 
                name: 'Gratin', 
                category: 'Dish',
            }
            const recipe_2 = {
                _id: '65464646155',
                name: 'Cheesecake',
                category: 'Dessert',
                nested: [
                    {
                        _id: '458445',
                        name: 'test-1',
                    },
                    {
                        _id: '88488',
                        name: 'test-2',
                    },
                    {
                        _id: '458455',
                        name: 'test-3',
                    },
                ],
            }
            const recipe_3 = {
                _id: '12335373873',
                name: 'Soupe',
                category: 'Starter',
            }
            await db.push('/recipes[0]', recipe_1, true)
            await db.push('/recipes[1]', recipe_2, true)
            await db.push('/recipes[2]', recipe_3, true)

            const routerPathStyle = '/recipes/65464646155/nested/88488'

            const normalPath = await db.toPath(routerPathStyle, '_id')

            expect(normalPath).toEqual('/recipes[1]/nested[1]')
        })
    })
    describe('Cleanup', () => {
        test('should remove the test files', async () => {
            fs.unlinkSync('test/recipe.json')
        })
    })
})
