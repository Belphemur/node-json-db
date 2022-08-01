import {IFileAdapter} from "../IAdapter";
import {readFile, writeFile} from "atomically";

export class AtomicFileAdapter implements IFileAdapter<string> {
    public readonly filename: string;
    private fsync: boolean;

    constructor(filename: string, fsync: boolean) {
        this.filename = filename;
        this.fsync = fsync;
    }

    async readAsync(): Promise<string | null> {
        try {
            return await readFile(this.filename, {
                encoding: 'utf-8'
            })
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw e
        }
    }

    writeAsync(data: string): Promise<void> {
        return writeFile(this.filename, data, {
            encoding: 'utf-8',
            fsync: this.fsync
        })
    }
}