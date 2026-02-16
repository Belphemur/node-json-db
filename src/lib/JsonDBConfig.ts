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

    /**
     * Enable encryption for the database using AES-256-GCM.
     * 
     * When encryption is enabled, the database filename automatically changes to use the `.enc.json` extension.
     * For example, `mydb.json` becomes `mydb.enc.json`. This prevents accidentally accessing encrypted 
     * databases without proper encryption settings.
     * 
     * This method is idempotent - calling it multiple times won't keep changing the filename.
     * 
     * @param cipherKey - The encryption key. Must be exactly 32 bytes. Can be:
     *   - A string of 32 characters
     *   - A Buffer of 32 bytes
     *   - A symmetric KeyObject with 256-bit key size (from Node.js crypto module)
     * 
     * @throws {Error} If the key is asymmetric (not supported)
     * @throws {Error} If the key length is not exactly 32 bytes
     * 
     * @example
     * ```typescript
     * import { Config } from 'node-json-db';
     * import { randomBytes } from 'crypto';
     * 
     * const config = new Config('mydb', true);
     * const key = randomBytes(32); // 32-byte encryption key
     * config.setEncryption(key);
     * // Database will now be stored in 'mydb.enc.json' with encrypted data
     * ```
     */
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
        
        // Change file extension to .enc.json (idempotent)
        if (!this._filename.endsWith('.enc.json')) {
            const currentExt = path.extname(this._filename);
            // Remove current extension and add .enc.json
            const baseName = currentExt ? this._filename.slice(0, -currentExt.length) : this._filename;
            this._filename = baseName + '.enc.json';
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