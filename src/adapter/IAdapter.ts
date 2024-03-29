/**
 * Use to read and write data of type T
 */
export interface IAdapter<T> {
    /**
     * Read the data from the medium
     */
    readAsync: () => Promise<T | null>
    /**
     * Write date into the medium
     * @param data
     */
    writeAsync: (data: T) => Promise<void>
}

export interface IFileAdapter<T> extends IAdapter<T> {
    /**
     * Name of the file used by the file adapter
     */
    readonly filename: string;
}