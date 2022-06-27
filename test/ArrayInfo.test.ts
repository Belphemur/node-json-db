import { ArrayInfo } from '../src/lib/ArrayInfo'

describe('ArrayInfo', () => {
  describe('constructor', () => {
    test('should set the index to zero when indicies is empty', () => {
      const arrayInfo = new ArrayInfo('abc[0]', [])
      expect(arrayInfo.getIndex({})).toBe(0)
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
})
