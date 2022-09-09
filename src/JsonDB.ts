import {KeyValue, merge, removeTrailingChar} from './lib/Utils'
import {DatabaseError, DataError} from './lib/Errors'
import {DBParentData} from './lib/DBParentData'
import {ArrayInfo} from './lib/ArrayInfo'
import {JsonDBConfig} from './lib/JsonDBConfig'
import * as AsyncLock from 'async-lock'

export {Config} from './lib/JsonDBConfig'
export {DatabaseError, DataError} from './lib/Errors'

type DataPath = Array<string>

export type FindCallback = (entry: any, index: number | string) => boolean


export class JsonDB {
    private loaded: boolean = false
    private data: KeyValue = {}
    private readonly config: JsonDBConfig
    private readonly lock = new AsyncLock()
    private readonly lockKey = 'jsonDb'

    /**
     * JSONDB Constructor
     * @param config Configuration for the database
     */
    constructor(config: JsonDBConfig) {
        this.config = config;
    }

    /**
     * Process datapath into different parts
     * @param dataPath
     */
    private processDataPath(dataPath: string): DataPath {
        if (dataPath === undefined || !dataPath.trim()) {
            throw new DataError("The Data Path can't be empty", 6)
        }
        if (dataPath == this.config.separator) {
            return []
        }
        dataPath = removeTrailingChar(dataPath, this.config.separator)
        const path = dataPath.split(this.config.separator)
        path.shift()
        return path
    }

    private async retrieveData(dataPath: DataPath, create: boolean = false): Promise<any> {
        await this.load()

        const thisDb = this

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
                    throw new DataError(
                        `Can't find dataPath: ${thisDb.config.separator}${dataPath.join(
                            thisDb.config.separator
                        )}. Stopped at ${property}`,
                        5
                    )
                }
            }

            const arrayInfo = ArrayInfo.processArray(property)
            if (arrayInfo) {
                property = arrayInfo.property
                findData(true)
                if (!Array.isArray(data)) {
                    throw new DataError(
                        `DataPath: ${thisDb.config.separator}${dataPath.join(
                            thisDb.config.separator
                        )}. ${property} is not an array.`,
                        11
                    )
                }
                const arrayIndex = arrayInfo.getIndex(data, true)
                if (!arrayInfo.append && data.hasOwnProperty(arrayIndex)) {
                    data = arrayInfo.getData(data)
                } else if (create) {
                    if (arrayInfo.append) {
                        data.push({})
                        data = data[data.length - 1]
                    } else {
                        data[arrayIndex] = {}
                        data = data[arrayIndex]
                    }
                } else {
                    throw new DataError(
                        `DataPath: ${thisDb.config.separator}${dataPath.join(
                            thisDb.config.separator
                        )}. . Can't find index ${arrayInfo.index} in array ${property}`,
                        10
                    )
                }
            } else {
                findData()
            }

            if (dataPath.length == ++index) {
                // check data
                return data
            }
            return recursiveProcessDataPath(data, index)
        }

        if (dataPath.length === 0) {
            return this.data
        }

        return recursiveProcessDataPath(this.data, 0)
    }

    private async getParentData(dataPath: string, create: boolean): Promise<DBParentData> {
        const path = this.processDataPath(dataPath)
        const last = path.pop()
        return new DBParentData(
            await this.retrieveData(path, create),
            this,
            dataPath,
            last
        )
    }

    /**
     * Get the wanted data
     * @param dataPath path of the data to retrieve
     */
    public getData(dataPath: string): Promise<any> {
        return this.lock.acquire(this.lockKey, async () => {
            const path = this.processDataPath(dataPath)
            return this.retrieveData(path, false)
        });
    }

    /**
     * Same as getData only here it's directly typed to your object
     * @param dataPath  path of the data to retrieve
     */
    public getObject<T>(dataPath: string): Promise<T> {
        return this.getData(dataPath)
    }

    /**
     * Check for existing datapath
     * @param dataPath
     */
    public async exists(dataPath: string): Promise<boolean> {
        try {
            await this.getData(dataPath)
            return true
        } catch (e) {
            if (e instanceof DataError) {
                return false
            }
            throw e
        }
    }

    /**
     * Returns the number of element which constitutes the array
     * @param dataPath
     */
    public async count(dataPath: string): Promise<number> {
        const result = await this.getData(dataPath)
        if (!Array.isArray(result)) {
            throw new DataError(`DataPath: ${dataPath} is not an array.`, 11)
        }
        const path = this.processDataPath(dataPath)
        const data = await this.retrieveData(path, false)
        return data.length
    }

    /**
     * Returns the index of the object that meets the criteria submitted. Returns -1, if no match is found.
     * @param dataPath  base dataPath from where to start searching
     * @param searchValue value to look for in the dataPath
     * @param propertyName name of the property to look for searchValue
     */
    public async getIndex(
        dataPath: string,
        searchValue: string | number,
        propertyName: string = 'id'
    ): Promise<number> {
        const data = await this.getArrayData(dataPath)
        return data
            .map(function (element: any) {
                return element[propertyName]
            })
            .indexOf(searchValue)
    }

    /**
     * Return the index of the value inside the array. Returns -1, if no match is found.
     * @param dataPath  base dataPath from where to start searching
     * @param searchValue value to look for in the dataPath
     */
    public async getIndexValue(dataPath: string, searchValue: string | number): Promise<number> {
        return (await this.getArrayData(dataPath)).indexOf(searchValue)
    }

    private async getArrayData(dataPath: string): Promise<any> {
        const result = await this.getData(dataPath)
        if (!Array.isArray(result)) {
            throw new DataError(`DataPath: ${dataPath} is not an array.`, 11)
        }
        const path = this.processDataPath(dataPath)
        return this.retrieveData(path, false)
    }

    /**
     * Find all specific entry in an array/object
     * @param rootPath base dataPath from where to start searching
     * @param callback method to filter the result and find the wanted entry. Receive the entry and it's index.
     */
    public async filter<T>(rootPath: string, callback: FindCallback): Promise<T[] | undefined> {
        const result = await this.getData(rootPath)
        if (Array.isArray(result)) {
            return result.filter(callback) as T[]
        }
        if (result instanceof Object) {
            const entries = Object.entries(result)
            const found = entries.filter((entry: [string, any]) => {
                return callback(entry[1], entry[0])
            }) as [string, T][]

            if (!found || found.length < 1) {
                return undefined
            }

            return found.map((entry: [string, T]) => {
                return entry[1]
            })
        }
        throw new DataError(
            'The entry at the path (' +
            rootPath +
            ') needs to be either an Object or an Array',
            12
        )
    }

    /**
     * Find a specific entry in an array/object
     * @param rootPath base dataPath from where to start searching
     * @param callback method to filter the result and find the wanted entry. Receive the entry and it's index.
     */
    public async find<T>(rootPath: string, callback: FindCallback): Promise<T | undefined> {
        const result = await this.getData(rootPath)
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
        throw new DataError(
            'The entry at the path (' +
            rootPath +
            ') needs to be either an Object or an Array',
            12
        )
    }

    /**
     * Pushing data into the database
     * @param dataPath path leading to the data
     * @param data data to push
     * @param override overriding or not the data, if not, it will merge them
     */
    public async push(dataPath: string, data: any, override: boolean = true): Promise<void> {
        return this.lock.acquire(this.lockKey, async () => {
            const dbData = await this.getParentData(dataPath, true)
            // if (!dbData) {
            //   throw new Error('Data not found')
            // }

            let toSet = data
            if (!override) {
                if (Array.isArray(data)) {
                    let storedData = dbData.getData()
                    if (storedData === undefined) {
                        storedData = []
                    } else if (!Array.isArray(storedData)) {
                        throw new DataError(
                            "Can't merge another type of data with an Array",
                            3
                        )
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

            if (this.config.saveOnPush) {
                await this.save()
            }
        });

    }

    /**
     * Delete the data
     * @param dataPath path leading to the data
     */
    public async delete(dataPath: string): Promise<void> {
        await this.lock.acquire(this.lockKey, async () => {
            const dbData = await this.getParentData(dataPath, true)
            // if (!dbData) {
            //   return
            // }
            dbData.delete()

            if (this.config.saveOnPush) {
                await this.save()
            }
        });

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
    public async reload(): Promise<void> {
        this.loaded = false
        await this.load()
    }

    /**
     * Manually load the database
     * It is automatically called when the first getData is done
     */
    public async load(): Promise<void> {
        if (this.loaded) {
            return
        }
        try {
            this.data = await this.config.adapter.readAsync();
            this.loaded = true
        } catch (err) {
            throw new DatabaseError("Can't Load Database", 1, err)
        }
    }

    /**
     * Manually save the database
     * By default you can't save the database if it's not loaded
     * @param force force the save of the database
     */
    public async save(force?: boolean): Promise<void> {
        force = force || false
        if (!force && !this.loaded) {
            throw new DatabaseError("DataBase not loaded. Can't write", 7)
        }
        try {
            await this.config.adapter.writeAsync(this.data);
        } catch (err) {
            throw new DatabaseError("Can't save the database", 2, err)
        }
    }
}
