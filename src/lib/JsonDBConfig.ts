import * as path from "path";
import {IAdapter} from "../adapter/IAdapter";
import {JsonAdapter} from "../adapter/data/JsonAdapter";
import {AtomicFileAdapter} from "../adapter/file/AtomicFileAdapter";

export interface JsonDBConfig {
    readonly adapter: IAdapter<any>,
    readonly saveOnPush: boolean,
    readonly humanReadable: boolean,
    readonly separator: string,
    readonly syncOnSave: boolean
}

export class Config implements JsonDBConfig {
    adapter: IAdapter<any>;
    public readonly filename: string
    humanReadable: boolean
    saveOnPush: boolean
    separator: string
    syncOnSave: boolean

    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false, separator: string = '/', syncOnSave: boolean = false) {
        this.filename = filename

        // Force json if no extension
        if (path.extname(filename) === "") {
            this.filename += ".json"
        }

        this.humanReadable = humanReadable
        this.saveOnPush = saveOnPush
        this.separator = separator
        this.syncOnSave = syncOnSave
        this.adapter = new JsonAdapter(new AtomicFileAdapter(this.filename));
    }
}

export class ConfigWithAdapter implements JsonDBConfig {
    readonly adapter: IAdapter<any>;
    readonly humanReadable: boolean;
    readonly saveOnPush: boolean;
    readonly separator: string;
    readonly syncOnSave: boolean;


    constructor(adapter: IAdapter<any>, humanReadable: boolean, saveOnPush: boolean, separator: string, syncOnSave: boolean) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
        this.saveOnPush = saveOnPush;
        this.separator = separator;
        this.syncOnSave = syncOnSave;
    }
}