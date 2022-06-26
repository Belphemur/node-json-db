import { DataError } from './Errors'
import { KeyValue } from './Utils'

function isInt(value: any) {
  return !isNaN(value) && Number(value) == value && !isNaN(parseInt(value, 10))
}

export const arrayRegex = () => /^([\.0-9a-zA-Z_$\-][0-9a-zA-Z_\-$\.]*)(.*)/gm
export const arrayIndiciesRegex = /\[(.?|.+?)\]/g
export const malformedArrayRegex = /\]|\[/g
const regexCache = {} as KeyValue

export class ArrayInfo {
  readonly property: string
  readonly index: number = 0
  readonly append: boolean = false
  readonly indicies = [] as any[]

  constructor(property: string, indicies: any[]) {
    this.property = property
    const index = indicies[0] ?? 0
    this.append = index === '' || indicies[indicies.length - 1] === ''
    this.indicies = indicies
    if (isInt(index)) {
      this.index = parseInt(index)
    } else if (!this.append) {
      throw new DataError('Only numerical values accepted for array index', 200)
    }
  }

  /**
   * Check if the property want to access an Array
   * @param property
   */
  public static processArray(property?: string): ArrayInfo | null {
    if (typeof property === 'undefined') {
      return null
    }

    if (regexCache[property]) {
      return regexCache[property]
    }

    const arrayIndexRegex = arrayRegex()
    const match = arrayIndexRegex.exec(property.trim())
    if (match != null && match[2]) {
      const propertyName = match[1]
      const nestedArrayMatches = match[2].toString()
      const nestedArrayIndicies = [
        ...nestedArrayMatches.matchAll(arrayIndiciesRegex),
      ].map((match) => match[1])
      let malformedArray = false
      nestedArrayIndicies.forEach((value) => {
        if (value.match(malformedArrayRegex)) {
          malformedArray = true
        }
      })
      if (!malformedArray && nestedArrayIndicies.length > 0) {
        return (regexCache[property] = new ArrayInfo(
          propertyName,
          nestedArrayIndicies
        ))
      }
    }

    return null
  }

  /**
   * Get the index for the array
   * @param data
   * @param avoidProperty
   */
  public getIndex(data: KeyValue, avoidProperty?: boolean): number {
    if (avoidProperty === undefined) {
      avoidProperty = false
    }

    if (this.append) {
      return -1
    }

    const index = this.index
    if (index == -1) {
      const dataIterable = avoidProperty ? data : data[this.property]

      if (dataIterable.length === 0) {
        return 0
      }
      return dataIterable.length - 1
    }
    return index
  }

  /**
   * Get the Data
   * @param data
   */
  public getData(data: KeyValue): any {
    if (this.append) {
      throw new DataError("Can't get data when appending", 100)
    }
    const index = this.getIndex(data)
    return data[this.property][index]
  }

  public getMultiDimensionalData(data: KeyValue): any {
    if (this.append) {
      throw new DataError("Can't get data when appending", 100)
    }
    this.indicies.forEach((index) => {
      data = data[index]
    })
    return data
  }

  /**
   * Set the data for the array
   * @param data
   * @param value
   */
  public setData(data: KeyValue, value: any): void {
    if (this.append) {
      let dataLocationToAppendTo = data[this.property]
      this.indicies.forEach((index) => {
        if (index === '') {
          return
        }
        dataLocationToAppendTo = dataLocationToAppendTo[+index]
      })
      dataLocationToAppendTo.push(value)
    } else {
      const index = this.getIndex(data)
      data[this.property][index] = value
    }
  }

  /**
   * Delete the index from the array
   * @param data
   */
  public delete(data: KeyValue): void {
    if (this.append) {
      throw new DataError("Can't delete an appended data", 10)
    }
    let indexToRemove = this.getIndex(data)
    let tempData = data[this.property]
    if (this.indicies.length > 0) {
      indexToRemove = this.indicies[this.indicies.length - 1]
      for (let i = 0; i < this.indicies.length - 1; i++) {
        tempData = tempData[i]
      }
    }
    tempData.splice(+indexToRemove, 1)
  }

  /**
   * Check if the ArrayInfo is valid for the given data
   * @param data
   */
  public isValid(data: KeyValue): boolean {
    const index = this.getIndex(data)
    return data[this.property].hasOwnProperty(index)
  }

  public isMultiDimensional() {
    return this.indicies.length > 1
  }
}
