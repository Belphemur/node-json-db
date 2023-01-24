import {IFileAdapter} from "../IAdapter";
import {readFile, open, FileHandle, mkdir} from "fs/promises";
import * as path from "path";

export class FileAdapter implements IFileAdapter<string> {
    public readonly filename: string;
    private readonly fsync: boolean;

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

    async writeAsync(data: string): Promise<void> {
        let fd: FileHandle | null = null;
        try {
            fd = await open(this.filename, 'w')
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw e;
            }
            const basepath = path.dirname(this.filename);
            await mkdir(basepath, {recursive: true});
            fd = await open(this.filename, 'w');
        }
        try {
            await fd.writeFile(data, {
                encoding: 'utf-8'
            })
            if (this.fsync) {
                await fd.sync()
            }
        } finally {
            await fd.close();
        }
    }
}