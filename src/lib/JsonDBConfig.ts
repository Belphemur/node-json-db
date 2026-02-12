import * as path from "path";
import {IAdapter} from "../adapter/IAdapter";
import {JsonAdapter} from "../adapter/data/JsonAdapter";
import {FileAdapter} from "../adapter/file/FileAdapter";
import { CipheredFileAdapter } from "../adapter/file/CipheredFileAdapter";
import { CipherKey, KeyObject } from 'crypto';

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
    syncOnSave: boolean
    humanReadable: boolean

    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false, separator: string = '/', syncOnSave: boolean = false) {
        this.filename = filename

        // Force json if no extension
        if (path.extname(filename) === "") {
            this.filename += ".json"
        }

        this.saveOnPush = saveOnPush
        this.separator = separator
        this.syncOnSave = syncOnSave
        this.humanReadable = humanReadable
        this.adapter = new JsonAdapter(new FileAdapter(this.filename, syncOnSave), humanReadable);
    }

    setEncryption(cipherKey: CipherKey) {
        if ((cipherKey as KeyObject).asymmetricKeyType) throw new Error('Asymmetric key not supported')
        const keyLength = (cipherKey as string).length || (cipherKey as KeyObject).symmetricKeySize
        if (!keyLength || keyLength < 32) throw new Error(`Invalid key length. Minimum 32 bytes but got ${keyLength}.`)
        this.adapter = new JsonAdapter(new CipheredFileAdapter(cipherKey, this.filename, this.syncOnSave), this.humanReadable);
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