import {KeyValue, merge, removeTrailingChar, setOwnProperty} from '#/lib/Utils.js'
import {DatabaseError, DataError} from '#/lib/Errors.js'
import {DBParentData} from '#/lib/DBParentData.js'
import {ArrayInfo} from '#/lib/ArrayInfo.js'
import {JsonDBConfig} from '#/lib/JsonDBConfig.js'
import {readLockAsync, writeLockAsync} from "#/lock/Lock.js";

//Export to be used by other projects that want to extend JsonDB
export {Config, ConfigWithAdapter} from '#/lib/JsonDBConfig.js'
export {DatabaseError, DataError} from '#/lib/Errors.js'
export type {IAdapter} from '#/adapter/IAdapter.js'
export type {ISerializer} from '#/adapter/data/ISerializer.js'
export {JsonAdapter} from '#/adapter/data/JsonAdapter.js'
export {FileAdapter} from '#/adapter/file/FileAdapter.js'
export {DateSerializer, SetSerializer, MapSerializer, RegExpSerializer, BigIntSerializer, defaultSerializers} from '#/adapter/data/Serializers.js'

type DataPath = Array<string>

export type FindCallback = (entry: any, index: number | string) => boolean


export class JsonDB {
    private loaded: boolean = false
    private data: KeyValue = {}
    private readonly config: JsonDBConfig

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
                if (data != null && Object.prototype.hasOwnProperty.call(data, property)) {
                    data = data[property]
                } else if (create) {
                    setOwnProperty(data, property, isArray ? [] : {})
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
                const exists =
                    Object.prototype.hasOwnProperty.call(data, arrayIndex) &&
                    (create || arrayInfo.hasInnerArrays(data))
                if (!arrayInfo.append && exists) {
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
     * @returns {Promise<any>}
     */
    public getData(dataPath: string): Promise<any> {
        return readLockAsync(async () => {
            const path = this.processDataPath(dataPath)
            return this.retrieveData(path, false)
        });
    }

    /**
     * Same as getData only here it's directly typed to your object
     * @param dataPath  path of the data to retrieve
     * @returns {Promise}
     */
    public getObject<T>(dataPath: string): Promise<T> {
        return this.getData(dataPath)
    }

    /**
     * Same as getData but with your own object type and a possible default value when we can't find the data path
     * @param dataPath path of the data to retrieve
     * @param defaultValue value to use when the dataPath doesn't lead to data
     * @returns {Promise}
     * @throws {DataError}
     */
    public async getObjectDefault<T>(dataPath: string, defaultValue?: T): Promise<T> {
        try {
            return await this.getData(dataPath);
        } catch (e) {
            if (!(e instanceof DataError)) {
                throw e;
            }
            // 5: a key is missing, 10: an array index is missing
            if (e.id != 5 && e.id != 10) {
                throw e;
            }
            return defaultValue as T;
        }
    }

    /**
     * Check for existing datapath
     * @param dataPath
     * @returns {Promise<boolean>}
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
     * @returns {Promise<number>}
     * @throws {DataError}
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
     * @returns {Promise<number>}
     */
    public async getIndex(
        dataPath: string,
        searchValue: string | number,
        propertyName: string = 'id'
    ): Promise<number> {
        const data = await this.getArrayData(dataPath)
        return data
            .map(function (element: any) {
                // Items can be null: a hole in an array is saved as null
                return element?.[propertyName]
            })
            .indexOf(searchValue)
    }

    /**
     * Return the index of the value inside the array. Returns -1, if no match is found.
     * @param dataPath  base dataPath from where to start searching
     * @param searchValue value to look for in the dataPath
     * @returns {Promise<number>}
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
     * @returns {Promise}
     * @throws {DataError}
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
     * @returns {Promise}
     * @throws {DataError}
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
     * @returns {Promise<void>}
     * @throws {DataError}
     */
    public async push(dataPath: string, data: any, override: boolean = true): Promise<void> {
        return writeLockAsync(async () => {
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
        await writeLockAsync(async () => {
            let dbData: DBParentData
            try {
                dbData = await this.getParentData(dataPath, false)
            } catch (e) {
                // A parent on the path doesn't exist, so there is nothing to delete.
                // Don't create it (that used to add empty objects and null array items).
                if (e instanceof DataError && (e.id === 5 || e.id === 10)) {
                    // An append segment ('[]') higher up the path points at an item that
                    // can't exist yet; reject it like a trailing append segment.
                    const parents = this.processDataPath(dataPath).slice(0, -1)
                    if (parents.some((part) => ArrayInfo.processArray(part)?.append)) {
                        throw new DataError("Can't delete an appended data", 10)
                    }
                    return
                }
                throw e
            }
            // A missing last index of a nested array resolves to undefined: nothing to delete.
            if (dbData.data === undefined || dbData.data === null) {
                return
            }
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
     * @return {Promise<void>}
     * @throws {DatabaseError}
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
     * @return {Promise<void>}
     * @throws {DatabaseError}
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


    /**
     * Convert a router style path to a normal path
     * By default propertyName to search is "id"
     * @param path router based path to a correct base path
     * @param propertyName name of the property to look for searchValue
     */
    public async fromPath(path: string, propertyName:string = 'id' ): Promise<string> {

        const [,...pathToQuery] = path.split("/")
        // The router path always uses "/", the returned DataPath uses the configured separator.
        const separator = this.config.separator

        // Walk the segments in order, two at a time (key, then value).
        // A key can come back deeper in the path (/comments/1/replies/2/replies/3).
        const normalPath: string[] = []

        for (let i = 0; i < pathToQuery.length; i += 2) {
            const pathKey = pathToQuery[i]
            const pathValue = pathToQuery[i + 1] ?? ''
            normalPath.push(`${separator}${pathKey}`)

            let pathIndex: number
            try {
                const items = await this.getArrayData(normalPath.join(""))
                // An exact (string) id wins. Else, as a router path is text,
                // a number id (id: 1) matches the segment "1".
                pathIndex = items.findIndex((element: any) => element?.[propertyName] === pathValue)
                if (pathIndex === -1) {
                    pathIndex = items.findIndex((element: any) => {
                        const id = element?.[propertyName]
                        return (typeof id === 'number' || typeof id === 'bigint') && String(id) === pathValue
                    })
                }
            } catch (error) {
                throw new DataError(`DataPath: ${normalPath.join("")}${separator}${pathValue} not found.`, 13, error)
            }
            // findIndex returns -1 when nothing matches, and [-1] means "last item" in a DataPath
            if (pathIndex === -1) {
                throw new DataError(`DataPath: ${normalPath.join("")}${separator}${pathValue} not found.`, 13)
            }
            normalPath.push(`[${pathIndex}]`)
        }

        return normalPath.join("")
    }
}
