import { DataError } from './Errors'
import { KeyValue } from './Utils'

export const arrayRegex = () =>
  /^([\.0-9a-zA-Z_$\-][0-9a-zA-Z_\-$\.]*)\[((?!(\]|\[)).*|)\]$/gm

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
    if (match != null) {
      const propertyName = match[1]
      // reset the match[2] to the full array index.
      const nestedArrayMatches = '[' + match[2].toString() + ']'
      const nestedArrayIndicies = getArrayIndicies(nestedArrayMatches)
      validateArrayIndicies(nestedArrayIndicies)
      return (regexCache[property] = new ArrayInfo(
        propertyName,
        nestedArrayIndicies
      ))
    }

    return null
  }

  /**
   * Get the index for the array
   * @param data
   * @param avoidProperty
   */
  public getIndex(data: KeyValue, avoidProperty?: boolean): number {
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
    const { index, dataForProperty } =
      this.getArrayDataAndIndexFromProperty(data)
    return dataForProperty[index]
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
        index = +index
        if (index === -1) {
          index = dataLocationToAppendTo.length - 1
        }
        dataLocationToAppendTo = dataLocationToAppendTo[+index]
      })
      dataLocationToAppendTo.push(value)
    } else {
      const { index, dataForProperty } =
        this.getArrayDataAndIndexFromProperty(data)
      if (index === -1) {
        dataForProperty.push(value)
      } else {
        dataForProperty[index] = value
      }
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
    const { index, dataForProperty } =
      this.getArrayDataAndIndexFromProperty(data)
    dataForProperty.splice(index, 1)
  }

  /**
   * Check if the ArrayInfo is valid for the given data
   * @param data
   */
  public isValid(data: KeyValue): boolean {
    const { index, dataForProperty } =
      this.getArrayDataAndIndexFromProperty(data)
    return dataForProperty.hasOwnProperty(index)
  }

  private getArrayDataAndIndexFromProperty(data: KeyValue): any {
    let indexToPull = 0
    let tempData = data instanceof Array ? data : data[this.property] ?? data
    if (this.indicies.length > 0) {
      indexToPull = +this.indicies[this.indicies.length - 1]
      for (let i = 0; i < this.indicies.length - 1; i++) {
        let index = +this.indicies[i]
        if (index === -1) {
          index = tempData.length - 1
        }
        tempData = tempData[index]
      }
      if (indexToPull === -1) {
        indexToPull = tempData.length - 1
      }
    }
    return { index: indexToPull, dataForProperty: tempData }
  }

  public isMultiDimensional() {
    return this.indicies.length > 1
  }
}

export function isInt(value: any) {
  return !isNaN(value) && Number(value) == value && !isNaN(parseInt(value, 10))
}

export function validateArrayIndicies(arrayIndicies: string[]) {
  const appendIndicies = arrayIndicies.filter((x) => x === '')
  if (appendIndicies.length > 1) {
    throw Error('Only one append index is supported for nested arrays')
  } else if (
    appendIndicies.length === 1 &&
    arrayIndicies[arrayIndicies.length - 1] !== ''
  ) {
    throw Error('Append index must be at the end of the nested array')
  }
}

export function validateArrayIndex(index: string) {
  // Append index
  if (index.length === 0) {
    return
  }
  if (!isInt(index)) {
    throw new DataError('Only numerical values accepted for array index', 200)
  }
}

export function getArrayIndicies(arrayIndicies: string): string[] {
  if (arrayIndicies.length === 0) {
    return []
  }

  if (arrayIndicies.charAt(0) !== '[') {
    throw new Error('Invalid array syntax detected')
  }

  const indexValue = arrayIndicies.substring(1, arrayIndicies.indexOf(']'))
  validateArrayIndex(indexValue)

  const nextArrayIndex = indexValue.length + 2
  return [
    indexValue,
    ...getArrayIndicies(arrayIndicies.substring(nextArrayIndex)),
  ]
}
