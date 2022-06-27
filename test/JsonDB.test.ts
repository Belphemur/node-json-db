import { JsonDB } from '../src/JsonDB'
import * as fs from 'fs'
jest.mock('fs')

describe('JsonDB', () => {
  let db: JsonDB
  beforeEach(() => {
    db = JsonDB.prototype // new JsonDB('', false)
  })
  describe('exists()', () => {
    test('should throw error when error is not instance of DataError', () => {
      db.getData = jest.fn(() => {
        throw 'error'
      })

      expect(() => {
        db.exists('a')
      }).toThrow('error')
    })
  })
  describe('count()', () => {
    test('should throw path error when path not found', () => {
      db.getData = jest.fn(() => {
        'a'
      })
      expect(() => {
        db.count('a')
      }).toThrow('DataPath: a is not an array.')
    })
  })
  describe('getArrayData()', () => {
    test('should throw path error when path not found', () => {
      db.getData = jest.fn(() => {
        'a'
      })
      expect(() => {
        db['getArrayData']('a')
      }).toThrow('DataPath: a is not an array.')
    })
  })
  describe('filter()', () => {
    test('should return undefined when not found', () => {
      db.getData = jest.fn(() => ({
        a: 1,
        b: 2,
      }))
      const result = db.filter<{ test: string }>(
        '/filter/data',
        (entry) => entry.test === 'echo'
      )
      expect(result).toBeUndefined()
    })
    test('should return undefined when found length < 1', () => {
      db.getData = jest.fn(() => ({
        a: 1,
        b: 2,
      }))
      const result = db.filter<{ a: string }>('/a', (entry) => entry.c === 1)
      expect(result).toBeUndefined()
    })
    test('should throw path error when path not found', () => {
      db.getData = jest.fn(() => 1)
      expect(() => {
        db.filter<{ a: string }>('/a', (entry) => entry.c === 1)
      }).toThrow(
        'The entry at the path (/a) needs to be either an Object or an Array'
      )
    })
  })
  describe('find()', () => {
    test('should return undefined when not found', () => {
      db.getData = jest.fn(() => ({
        a: 1,
        b: 2,
      }))
      const result = db.find<{ test: string }>(
        '/filter/data',
        (entry) => entry.test === 'echo'
      )
      expect(result).toBeUndefined()
    })
    test('should return undefined when found length < 1', () => {
      db.getData = jest.fn(() => ({
        a: 1,
        b: 2,
      }))
      const result = db.find<{ a: string }>('/a', (entry) => entry.c === 1)
      expect(result).toBeUndefined()
    })
    test('should throw path error when path not found', () => {
      db.getData = jest.fn(() => 1)
      expect(() => {
        db.find<{ a: string }>('/a', (entry) => entry.c === 1)
      }).toThrow(
        'The entry at the path (/a) needs to be either an Object or an Array'
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
      expect(() => {
        db.save(true)
      }).toThrow("Can't save the database")
    })
  })
})
