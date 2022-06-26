jest.mock('../src/JsonDB.ts')
import { JsonDB } from '../src/JsonDB'
import { DBParentData } from '../src/lib/DBParentData'

describe('DBParentData', () => {
  test('should call db reset when parent is undefined', () => {
    const dbMock = JsonDB.prototype
    const dbParentData = new DBParentData('', dbMock, '', undefined)
    dbParentData.delete()
    expect(dbMock.resetData).toHaveBeenCalled()
  })
})
