import { JsonDB } from '../src/JsonDB'
import * as fs from 'fs'

describe('Array Utils', () => {
  const db = new JsonDB('test/recipe', true, true)
  describe('get number of item in an array', () => {
    test('should have the correct count of an array', () => {
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
      const recipe_3 = { id: 12335373873, name: 'Soup', category: 'Starter' }
      db.push('/recipes[0]', recipe_1, true)
      db.push('/recipes[1]', recipe_2, true)
      db.push('/recipes[2]', recipe_3, true)

      expect(db.count('/recipes')).toBe(3)
    })
  })
  describe('get index of item in an array', () => {
    test('should get the index of the current value', () => {
      const recipe_1 = {
        id: '65464646155',
        name: 'Cheesecake',
        category: 'Dessert',
      }
      const recipe_2 = { id: '78687873783', name: 'Gratin', category: 'Dish' }
      const recipe_3 = {
        id: '12335373873',
        name: 'Soupe',
        category: 'Starter',
      }
      db.push('/recipes[0]', recipe_1, true)
      db.push('/recipes[1]', recipe_2, true)
      db.push('/recipes[2]', recipe_3, true)

      expect(db.getIndex('/recipes', '65464646155')).toBe(0)
      expect(db.getIndex('/recipes', '78687873783')).toBe(1)
      expect(db.getIndex('/recipes', '12335373873')).toBe(2)

      db.delete('/recipes[' + db.getIndex('/recipes', '78687873783') + ']')

      expect(db.getIndex('/recipes', '65464646155')).toBe(0)
      expect(db.getIndex('/recipes', '12335373873')).toBe(1)
    })

    test('should get the index of the current value with anything but id', () => {
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
      db.push('/recipes[0]', recipe_1, true)
      db.push('/recipes[1]', recipe_2, true)
      db.push('/recipes[2]', recipe_3, true)

      expect(db.getIndex('/recipes', '65464646155', 'test')).toBe(0)
      expect(db.getIndex('/recipes', '78687873783', 'test')).toBe(1)
      expect(db.getIndex('/recipes', '12335373873', 'test')).toBe(2)
    })
    test('should get the index of the current value with anything but numerical', () => {
      const recipe_1 = {
        test: 65464646155,
        name: 'Cheesecake',
        category: 'Dessert',
      }
      const recipe_2 = { test: 78687873783, name: 'Gratin', category: 'Dish' }
      const recipe_3 = {
        test: 12335373873,
        name: 'Soupe',
        category: 'Starter',
      }
      db.push('/recipes[0]', recipe_1, true)
      db.push('/recipes[1]', recipe_2, true)
      db.push('/recipes[2]', recipe_3, true)

      expect(db.getIndex('/recipes', 65464646155, 'test')).toBe(0)
      expect(db.getIndex('/recipes', 78687873783, 'test')).toBe(1)
      expect(db.getIndex('/recipes', 12335373873, 'test')).toBe(2)
    })

    test('should get the index of an array with string', () => {
      db.push('/indexValue[]', 'abc', true)
      db.push('/indexValue[]', 'def', true)
      db.push('/indexValue[]', 'gh', true)

      expect(db.getIndexValue('/indexValue', 'abc')).toBe(0)
      expect(db.getIndexValue('/indexValue', 'def')).toBe(1)
      expect(db.getIndexValue('/indexValue', 'gh')).toBe(2)
    })
  })
  describe('Nested array', () => {
    test('get data of a nested array', () => {
      db.push('/nested/0/array', [['test', 'test2']], true)
      expect(db.getData('/nested/0/array[0][0]')).toBe('test')
    })
    test('append data to a nested array', () => {
      db.push('/nested/1/array', [['test', 'test2']], true)
      db.push('/nested/1/array[0][]', 'test3', true)
      expect(db.getData('/nested/1/array[0][2]')).toBe('test3')
    })
    test('get data of a multiple nested array', () => {
      db.push('/nested/0/array', [[['test', 'test2']]], true)
      expect(db.getData('/nested/0/array[0][0][0]')).toBe('test')
    })
    test('should delete array index at specified position', () => {
      db.push('/nested/0/array', [
        ['abc', 'def'],
        ['hij', 'klmn'],
      ])
      db.delete('/nested/0/array[0][0]')
      expect(db.getData('/nested/0/array[0][0]')).toBe('def')
    })
    describe('', () => {
      beforeEach(() => [
        db.push('/nested/0/array', [
          [['abc', 'def'], [['hij', 'klmn']]],
          ['123', '456'],
          ['789', '100'],
        ]),
      ])
      test('should have the correct counts', () => {
        // first level
        expect(db.count('/nested/0/array')).toBe(3)
        // second level
        expect(db.count('/nested/0/array[0]')).toBe(2)
        expect(db.count('/nested/0/array[1]')).toBe(2)
        expect(db.count('/nested/0/array[2]')).toBe(2)
        // third level
        expect(db.count('/nested/0/array[0][0]')).toBe(2)
        // fourth level
        expect(db.count('/nested/0/array[0][1][0]')).toBe(2)
      })
      test('should have correct information after delete', () => {
        const deepestArrayParentQuery = '/nested/0/array[0][1][0]'
        const deepestArrayEntryQuery = `${deepestArrayParentQuery}[0]`
        // validate array value before delete
        expect(db.getData(deepestArrayEntryQuery)).toBe('hij')

        db.delete(deepestArrayEntryQuery)
        // validate array value after delete
        expect(db.count(deepestArrayParentQuery)).toBe(1)
        expect(db.getData(deepestArrayEntryQuery)).toBe('klmn')
      })

      test('should return the last entry for an array when using -1', () => {
        // first level
        expect(db.getData('/nested/0/array[-1][0]')).toBe('789')
        // second level
        expect(db.getData('/nested/0/array[0][-1]')).toEqual([['hij', 'klmn']])
        // third level
        expect(db.getData('/nested/0/array[0][-1][-1]')).toEqual([
          'hij',
          'klmn',
        ])
        // fourth level
        expect(db.getData('/nested/0/array[0][-1][-1][-1]')).toBe('klmn')
      })

      test('should delete last entry when using -1', () => {
        db.delete('/nested/0/array[0][-1][-1][-1]')
        expect(db.count('/nested/0/array[0][-1][-1]')).toBe(1)
        expect(db.getData('/nested/0/array[0][-1][-1][0]')).toBe('hij')
        expect(db.getData('/nested/0/array[0][-1][-1][1]')).toBeUndefined()
      })

      test('should add to the last entry when using -1', () => {
        db.push('/nested/0/array[0][-1][-1][]', 'lastRecord')
        expect(db.count('/nested/0/array[0][-1][-1]')).toBe(3)
        expect(db.getData('/nested/0/array[0][-1][-1][2]')).toBe('lastRecord')
      })
    })
  })
  describe('Nested array regex', () => {
    // Test added to play with the regex
    test('should find index for nested array', () => {
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
          ...nestedArrayMatches.matchAll(/\[(.?|.+?)\]/g),
        ].map((match) => match[1])
      }
      expect(property).toBe('array')
      expect(nestedArrayIndicies[0]).toEqual('1')
      expect(nestedArrayIndicies[1]).toEqual('2')
    })
  })
  describe('Cleanup', () => {
    test('should remove the test files', () => {
      fs.unlinkSync('test/recipe.json')
    })
  })
})
