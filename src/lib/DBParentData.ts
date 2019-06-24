import {ArrayInfo} from "./ArrayInfo"
import {DataError} from "./Errors"
import {KeyValue} from "./Utils"
import {JsonDB} from "../JsonDB"

export class DBParentData {
    readonly parent?: string
    readonly data: KeyValue
    readonly db: JsonDB
    readonly dataPath: string


    constructor(data: any, db: JsonDB, dataPath: string, parent?: string) {
        this.parent = parent
        this.data = data
        this.db = db
        this.dataPath = dataPath
    }

    /**
     * Check if it's an array
     * @param deletion
     */
    private checkArray(deletion: boolean = false): ArrayInfo | null {
        const arrayInfo = ArrayInfo.processArray(this.parent)
        if (arrayInfo && (!arrayInfo.append || deletion) && !arrayInfo.isValid(this.data)) {
            throw new DataError("DataPath: /" + this.dataPath + ". Can't find index " + arrayInfo.index + " in array " + arrayInfo.property, 10)
        }

        return arrayInfo
    }

    /**
     * Get the data linked to this path
     */
    public getData(): any {
        if (this.parent === undefined) {
            return this.data
        }
        const arrayInfo = this.checkArray()
        if (arrayInfo) {
            return arrayInfo.getData(this.data)
        } else {
            return this.data[this.parent]
        }
    }

    /**
     * Set the data to the wanted path
     * @param toSet
     */
    public setData(toSet: any): void {
        if (this.parent === undefined) {
            this.db.resetData(toSet)
            return
        }

        const arrayInfo = ArrayInfo.processArray(this.parent)
        if (arrayInfo) {
            if (!this.data.hasOwnProperty(arrayInfo.property)) {
                this.data[arrayInfo.property] = []
            } else if (!Array.isArray(this.data[arrayInfo.property])) {
                throw new DataError("DataPath: /" + this.dataPath + ". " + arrayInfo.property + " is not an array.", 11)
            }
            arrayInfo.setData(this.data, toSet)
        } else {
            this.data[this.parent] = toSet
        }

    }

    /**
     * Delete the data of the current path
     */
    public delete(): void {
        if (this.parent === undefined) {
            this.db.resetData({})
            return
        }
        const arrayInfo = this.checkArray(true)
        if (arrayInfo) {
            arrayInfo.delete(this.data)
        } else {
            delete this.data[this.parent]
        }
    }
}