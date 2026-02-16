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
    private _filename: string
    saveOnPush: boolean
    separator: string
    syncOnSave: boolean
    humanReadable: boolean

    get filename(): string {
        return this._filename;
    }

    constructor(filename: string, saveOnPush: boolean = true, humanReadable: boolean = false, separator: string = '/', syncOnSave: boolean = false) {
        this._filename = filename

        // Force json if no extension
        if (path.extname(filename) === "") {
            this._filename += ".json"
        }

        this.saveOnPush = saveOnPush
        this.separator = separator
        this.syncOnSave = syncOnSave
        this.humanReadable = humanReadable
        this.adapter = new JsonAdapter(new FileAdapter(this._filename, syncOnSave), humanReadable);
    }

    setEncryption(cipherKey: CipherKey) {
        if ((cipherKey as KeyObject).asymmetricKeyType) throw new Error('Asymmetric key not supported')
         let keyLength: number | undefined;
        if (typeof cipherKey === 'string') {
            keyLength = Buffer.byteLength(cipherKey);
        } else if (cipherKey instanceof Buffer) {
            keyLength = cipherKey.length;
        } else {
            keyLength = (cipherKey as KeyObject).symmetricKeySize;
        }
        if (!keyLength || keyLength !== 32) {
            throw new Error(`Invalid key length. Expected 32 bytes for aes-256-gcm but got ${keyLength}.`);
        }
        
        // Change file extension to .enc.json
        const currentExt = path.extname(this._filename);
        if (currentExt === '.json') {
            this._filename = this._filename.slice(0, -5) + '.enc.json';
        } else if (currentExt !== '.enc.json') {
            // If it's not .json or .enc.json, append .enc.json
            this._filename += '.enc.json';
        }
        
        this.adapter = new JsonAdapter(new CipheredFileAdapter(cipherKey, this._filename, this.syncOnSave), this.humanReadable);
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