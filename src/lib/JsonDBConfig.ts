import * as path from "path";
import {IAdapter} from "../adapter/IAdapter";
import {JsonAdapter} from "../adapter/data/JsonAdapter";
import {AtomicFileAdapter} from "../adapter/file/AtomicFileAdapter";

export interface JsonDBConfig {
    readonly adapter: IAdapter<any>,
    readonly saveOnPush: boolean,
    readonly humanReadable: boolean,
    readonly separator: string,
}

export class Config implements JsonDBConfig {
    adapter: IAdapter<any>;
    public readonly filename: string
    humanReadable: boolean
    saveOnPush: boolean
    separator: string

    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false, separator: string = '/', syncOnSave: boolean = false) {
        this.filename = filename

        // Force json if no extension
        if (path.extname(filename) === "") {
            this.filename += ".json"
        }

        this.humanReadable = humanReadable
        this.saveOnPush = saveOnPush
        this.separator = separator
        this.adapter = new JsonAdapter(new AtomicFileAdapter(this.filename, syncOnSave));
    }
}

export class ConfigWithAdapter implements JsonDBConfig {
    readonly adapter: IAdapter<any>;
    readonly humanReadable: boolean;
    readonly saveOnPush: boolean;
    readonly separator: string;


    constructor(adapter: IAdapter<any>, humanReadable: boolean, saveOnPush: boolean, separator: string) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
        this.saveOnPush = saveOnPush;
        this.separator = separator;
    }
}