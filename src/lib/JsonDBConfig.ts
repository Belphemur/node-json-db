import * as path from "path";
import {IAdapter} from "../adapter/IAdapter";
import {JsonAdapter} from "../adapter/data/JsonAdapter";
import {AtomicFileAdapter} from "../adapter/file/AtomicFileAdapter";

export interface JsonDBConfig {
    readonly adapter: IAdapter<any>,
    readonly saveOnPush: boolean,
    readonly separator: string,
}

export class Config implements JsonDBConfig {
    adapter: IAdapter<any>;
    public readonly filename: string
    saveOnPush: boolean
    separator: string

    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false, separator: string = '/', syncOnSave: boolean = false) {
        this.filename = filename

        // Force json if no extension
        if (path.extname(filename) === "") {
            this.filename += ".json"
        }

        this.saveOnPush = saveOnPush
        this.separator = separator
        this.adapter = new JsonAdapter(new AtomicFileAdapter(this.filename, syncOnSave), humanReadable);
    }
}

export class ConfigWithAdapter implements JsonDBConfig {
    readonly adapter: IAdapter<any>;
    readonly saveOnPush: boolean;
    readonly separator: string;


    constructor(adapter: IAdapter<any>, saveOnPush: boolean = true, separator: string = '/') {
        this.adapter = adapter;
        this.saveOnPush = saveOnPush;
        this.separator = separator;
    }
}