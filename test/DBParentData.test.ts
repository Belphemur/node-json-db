jest.mock('../src/JsonDB')
import { JsonDB } from '../src/JsonDB.js'
import { DBParentData } from '../src/lib/DBParentData.js'

describe('DBParentData', () => {
  test('should call db reset when parent is undefined', () => {
    const dbMock = JsonDB.prototype
    const dbParentData = new DBParentData('', dbMock, '', undefined)
    dbParentData.delete()
    expect(dbMock.resetData).toHaveBeenCalled()
  })
})
