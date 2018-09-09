import {KeyValue, merge, removeTrailingSlash} from "./lib/Utils"
import * as FS from 'fs'
import * as path from "path"
import * as mkdirp from "mkdirp"
import {DatabaseError, DataError} from "./lib/Errors"
import {DBParentData} from "./lib/DBParentData"
import {ArrayInfo} from "./lib/ArrayInfo"

type DataPath = Array<string>


export type FindCallback = (entry: any, index: number | string) => boolean

export default class JsonDB {
    readonly filename: string
    private loaded: boolean = false
    private data: KeyValue = {}
    readonly saveOnPush: boolean = true
    readonly humanReadable: boolean


    /**
     * JSONDB Constructor
     * @param filename where to save the "DB"
     * @param saveOnPush save the database at each push command into the json file
     * @param humanReadable the JSON file will be readable easily by a human
     */
    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false) {
        this.filename = filename

        if (!filename.endsWith(".json")) {
            this.filename += ".json"
        }

        this.saveOnPush = saveOnPush
        this.humanReadable = humanReadable

        if (!FS.existsSync(this.filename)) {
            const dirname = path.dirname(this.filename)
            mkdirp.sync(dirname)
            this.save(true)
            this.loaded = true
        }
    }

    /**
     * Process datapath into different parts
     * @param dataPath
     */
    private processDataPath(dataPath: string): DataPath {
        if (dataPath === undefined || !dataPath.trim()) {
            throw new DataError("The Data Path can't be empty", 6)
        }
        if (dataPath == "/") {
            return []
        }
        dataPath = removeTrailingSlash(dataPath)
        const path = dataPath.split("/")
        path.shift()
        return path
    }

    private retrieveData(dataPath: DataPath, create: boolean = false) {
        this.load()

        const recursiveProcessDataPath = (data: any, index: number): any => {

            let property = dataPath[index]


            /**
             * Find the wanted Data or create it.
             */
            function findData(isArray: boolean = false) {
                if (data.hasOwnProperty(property)) {
                    data = data[property]
                } else if (create) {
                    if (isArray) {
                        data[property] = []
                    } else {
                        data[property] = {}
                    }
                    data = data[property]
                } else {
                    throw new DataError("Can't find dataPath: /" + dataPath.join("/") + ". Stopped at " + property, 5)
                }
            }

            const arrayInfo = ArrayInfo.processArray(property)
            if (arrayInfo) {
                property = arrayInfo.property
                findData(true)
                if (!Array.isArray(data)) {
                    throw new DataError("DataPath: /" + dataPath.join("/") + ". " + property + " is not an array.", 11)
                }
                const arrayIndex = arrayInfo.getIndex(data, true)
                if (!arrayInfo.append && data.hasOwnProperty(arrayIndex)) {
                    data = data[arrayIndex]
                } else if (create) {
                    if (arrayInfo.append) {
                        data.push({})
                        data = data[data.length - 1]
                    }
                    else {
                        data[arrayIndex] = {}
                        data = data[arrayIndex]
                    }
                } else {
                    throw new DataError("DataPath: /" + dataPath.join("/") + ". Can't find index " + arrayInfo.index + " in array " + property, 10)
                }
            } else {
                findData()
            }

            if (dataPath.length == ++index) {
                return data
            }
            return recursiveProcessDataPath(data, index)
        }

        if (dataPath.length === 0) {
            return this.data
        }

        return recursiveProcessDataPath(this.data, 0)
    }

    private getParentData(dataPath: string, create: boolean): DBParentData {
        const path = this.processDataPath(dataPath)
        const last = path.pop()
        return new DBParentData(this.retrieveData(path, create), this, dataPath, last)
    }

    /**
     * Get the wanted data
     * @param dataPath
     */
    public getData(dataPath: string): any {
        const path = this.processDataPath(dataPath)
        return this.retrieveData(path, false)
    }

    /**
     * Check for existing datapath
     * @param dataPath
     */
    public exists(dataPath: string): boolean {
        try {
            this.getData(dataPath)
            return true
        } catch (e) {
            if (e instanceof DataError) {
                return false
            }
            throw e
        }
    }

    /**
     * Find a specific entry in an array/object
     * @param rootPath base dataPath from where to start searching
     * @param callback method to filter the result and find the wanted entry. Receive the entry and it's index.
     */
    public find<T>(rootPath: string, callback: FindCallback): T | undefined {
        const result = this.getData(rootPath)
        if (Array.isArray(result)) {
            return result.find(callback) as T
        }
        if (result instanceof Object) {
            const entries = Object.entries(result)
            const found = entries.find((entry: Array<any>) => {
                return callback(entry[1], entry[0])
            })
            if (!found || found.length < 2) {
                return undefined
            }
            return found[1] as T
        }
        throw new DataError("The entry at the path (" + rootPath + ") needs to be either an Object or an Array", 12)
    }

    /**
     * Pushing data into the database
     * @param dataPath path leading to the data
     * @param data data to push
     * @param override overriding or not the data, if not, it will merge them
     */
    public push(dataPath: string, data: any, override: boolean = true): void {
        const dbData = this.getParentData(dataPath, true)
        if (!dbData) {
            throw new Error("Data not found")
        }

        let toSet = data
        if (!override) {
            if (Array.isArray(data)) {
                let storedData = dbData.getData()
                if (storedData === undefined) {
                    storedData = []
                } else if (!Array.isArray(storedData)) {
                    throw new DataError("Can't merge another type of data with an Array", 3)
                }
                toSet = storedData.concat(data)
            } else if (data === Object(data)) {
                if (Array.isArray(dbData.getData())) {
                    throw new DataError("Can't merge an Array with an Object", 4)
                }
                toSet = merge(dbData.getData(), data)
            }
        }
        dbData.setData(toSet)

        if (this.saveOnPush) {
            this.save()
        }
    }

    /**
     * Delete the data
     * @param dataPath path leading to the data
     */
    public delete(dataPath: string): void {
        var dbData = this.getParentData(dataPath, true)
        if (!dbData) {
            return
        }
        dbData.delete()

        if (this.saveOnPush) {
            this.save()
        }
    }

    /**
     * Only use this if you know what you're doing.
     * It reset the full data of the database.
     * @param data
     */
    public resetData(data: any): void {
        this.data = data
    }

    /**
     * Reload the database from the file
     */
    public reload(): void {
        this.loaded = false
        this.load()
    };

    /**
     * Manually load the database
     * It is automatically called when the first getData is done
     */
    public load(): void {
        if (this.loaded) {
            return
        }
        try {
            const data = FS.readFileSync(this.filename, 'utf8')
            this.data = JSON.parse(data)
            this.loaded = true
        } catch (err) {
            const error = new DatabaseError("Can't Load Database", 1, err)
            throw error
        }
    }

    /**
     * Manually save the database
     * By default you can't save the database if it's not loaded
     * @param force force the save of the database
     */
    public save(force?: boolean): void {
        force = force || false
        if (!force && !this.loaded) {
            throw new DatabaseError("DataBase not loaded. Can't write", 7)
        }
        var data = ""
        try {
            if (this.humanReadable) {
                data = JSON.stringify(this.data, null, 4)
            }
            else {
                data = JSON.stringify(this.data)
            }
            FS.writeFileSync(this.filename, data, 'utf8')
        } catch (err) {
            var error = new DatabaseError("Can't save the database", 2, err)
            throw error
        }
    }
}