import {IFileAdapter} from "../IAdapter";
import {readFile, writeFile} from "atomically";

export class AtomicFileAdapter implements IFileAdapter<string> {
    public readonly filename: string;

    constructor(filename: string) {
        this.filename = filename;
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
            encoding: 'utf-8'
        })
    }
}