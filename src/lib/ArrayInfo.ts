import {DataError} from "./Errors"
import {KeyValue} from "./Utils"

function isInt(value: any) {
    return !isNaN(value) &&
        Number(value) == value && !isNaN(parseInt(value, 10))
}

export const arrayRegex = () => /^([\.0-9a-zA-Z_$\-][0-9a-zA-Z_\-$\.]*)\[((?!(\]|\[)).*|)\]$/gm
const regexCache = {} as KeyValue

export class ArrayInfo {
    readonly property: string
    readonly index: number = 0
    readonly append: boolean = false


    constructor(property: string, index: any) {
        this.property = property
        this.append = index === ""
        if (isInt(index)) {
            this.index = parseInt(index)
        } else if (!this.append) {
            throw new DataError("Only numerical values accepted for array index", 200)
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
            return (regexCache[property] = new ArrayInfo(match[1], match[2]))
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

    /**
     * Set the data for the array
     * @param data
     * @param value
     */
    public setData(data: KeyValue, value: any): void {
        if (this.append) {
            data[this.property].push(value)
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
        const index = this.getIndex(data)
        data[this.property].splice(index, 1)
    }

    /**
     * Check if the ArrayInfo is valid for the given data
     * @param data
     */
    public isValid(data: KeyValue): boolean {
        const index = this.getIndex(data)
        return data[this.property].hasOwnProperty(index)
    }
}