import {IAdapter} from "../IAdapter";
import {Writer} from "steno";
import * as fs from "fs";

export class StenoAdapter implements IAdapter<string> {
    private filename: string;
    private writer: Writer;

    constructor(filename: string) {
        this.filename = filename;
        this.writer = new Writer(this.filename);
    }

    async readAsync(): Promise<string | null> {
        let data

        try {
            data = await fs.promises.readFile(this.filename, 'utf-8')
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
                return null
            }
            throw e
        }

        return data
    }

    writeAsync(data: string): Promise<void> {
        return this.writer.write(data);
    }
}