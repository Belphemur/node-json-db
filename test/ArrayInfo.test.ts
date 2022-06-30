import { notDeepEqual } from 'assert'
import {
  ArrayInfo,
  getArrayIndicies,
  validateArrayIndex,
  validateArrayIndicies,
} from '../src/lib/ArrayInfo'

describe('ArrayInfo', () => {
  describe('constructor', () => {
    test('should set the index to zero when indicies is empty', () => {
      const arrayInfo = new ArrayInfo('abc[0]', [])
      expect(arrayInfo.getIndex({})).toBe(0)
    })
    test('should throw error when invalid index is passed in', () => {
      expect(() => {
        new ArrayInfo('abc[0]', ['a'])
      }).toThrow('Only numerical values accepted for array index')
    })
  })
  describe('getData()', () => {
    test('should set avoid property to false when undefined', () => {
      const data = {}
      const arrayInfo = new ArrayInfo('abc[]', [0])
      const mockGetArrayDataAndIndexFromProperty = jest.fn(() => ({
        index: 0,
        dataForProperty: {},
      }))
      arrayInfo['getArrayDataAndIndexFromProperty'] =
        mockGetArrayDataAndIndexFromProperty

      arrayInfo.getData(data)

      expect(mockGetArrayDataAndIndexFromProperty).toHaveBeenCalled()
    })
    test('should throw DataError when ArrayInfo is appending', () => {
      const arrayInfo = new ArrayInfo('abc[]', [''])
      expect(() => {
        arrayInfo.getData({})
      }).toThrow("Can't get data when appending")
    })
  })
  describe('getIndex()', () => {
    test('should return 0 when index is -1, and avoidProperty is true, and data is empty', () => {
      const arrayInfo = new ArrayInfo('abc[]', [0])
      const index = arrayInfo.getIndex({ data: [] }, true)
      expect(index).toBe(0)
    })
    test('should return 0 when index is -1, and avoidProperty is undefined, and data is empty', () => {
      const arrayInfo = new ArrayInfo('abc[0]', [0])
      const index = arrayInfo.getIndex({ abc: [1] })
      expect(index).toBe(0)
    })
    test('should return length-1 when index is -1, and avoidProperty is true, and data is populated', () => {
      const arrayInfo = new ArrayInfo('abc', [-1])
      const dataArray = [1, 2, 3, 4]
      const index = arrayInfo.getIndex({ abc: [...dataArray] }, false)
      expect(index).toBe(dataArray.length - 1)
    })
  })
  describe('isMultiDimensional()', () => {
    test('should return false when indicies length is <= 1', () => {
      const arrayInfo = new ArrayInfo('abc[]', [0])
      expect(arrayInfo.isMultiDimensional()).toBe(false)
    })
    test('should return false when indicies length is > 1', () => {
      const arrayInfo = new ArrayInfo('abc[]', [0, 0])
      expect(arrayInfo.isMultiDimensional()).toBe(true)
    })
  })
  describe('validateArrayIndex()', () => {
    test('should throw error when array index content contains "["', () => {
      expect(() => {
        validateArrayIndex('[')
      }).toThrow('Only numerical values accepted for array index')
    })
    test('should throw error when array index content contains "["', () => {
      expect(() => {
        validateArrayIndex(']')
      }).toThrow('Only numerical values accepted for array index')
    })
    test('should throw error when array index contains characters', () => {
      expect(() => {
        validateArrayIndex('abc')
      }).toThrow('Only numerical values accepted for array index')
    })
    test('should succeede when array index contains numbers', () => {
      expect(() => {
        validateArrayIndex('10')
      }).not.toThrow()
    })
  })
  describe('getArrayIndicies()', () => {
    test('should succeed when valid array indexes are passed in', () => {
      const validArrayIndicies = '[0][0][0]'
      const arrayIndicies = getArrayIndicies(validArrayIndicies)
      expect(arrayIndicies).toEqual(['0', '0', '0'])
    })
    test('should create array with same positions as values passed in.', () => {
      const validArrayIndicies = '[0][0][]'
      const arrayIndicies = getArrayIndicies(validArrayIndicies)
      expect(arrayIndicies).toEqual(['0', '0', ''])
    })
    test('should throw error when invalid array index is passed in', () => {
      const invalidArrayIndicies = '[]]'
      expect(() => {
        getArrayIndicies(invalidArrayIndicies)
      }).toThrow('Invalid array syntax detected')
    })
    test('should throw error when invalid nested array syntax is passed in', () => {
      const invalidArrayIndicies = '[0]1[0]'
      expect(() => {
        getArrayIndicies(invalidArrayIndicies)
      }).toThrow('Invalid array syntax detected')
    })
    test('should throw error when invalid array index is passed in', () => {
      const invalidArrayIndicies = '[0]['
      expect(() => {
        getArrayIndicies(invalidArrayIndicies)
      }).toThrow('Only numerical values accepted for array index')
    })
    test('should throw error when invalid array index is passed in', () => {
      const invalidArrayIndicies = '[]['
      expect(() => {
        getArrayIndicies(invalidArrayIndicies)
      }).toThrow('Only numerical values accepted for array index')
    })
  })
  describe('validateArrayIndicies()', () => {
    test('should succeed when append syntax is at the end of the nested array', () => {
      const validAppendIndicies = ['0', '2', '4', '']
      expect(() => {
        validateArrayIndicies(validAppendIndicies)
      }).not.toThrow()
    })
    test('should throw error when append syntax is not at the end of the nested array', () => {
      const invalidAppendIndicies = ['0', '2', '', '4']
      expect(() => {
        validateArrayIndicies(invalidAppendIndicies)
      }).toThrow('Append index must be at the end of the nested array')
    })
    test('should throw error when append syntax is defined more than once in the nested array', () => {
      const invalidAppendIndicies = ['0', '2', '', '']
      expect(() => {
        validateArrayIndicies(invalidAppendIndicies)
      }).toThrow('Only one append index is supported for nested arrays')
    })
  })
})
