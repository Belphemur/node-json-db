import { FileAdapter } from "./FileAdapter";
import { CipherKey, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
// Sconst KEY = crypto.randomBytes(32); // 256 bits

interface CipheredData {
    iv: string;
    tag: string;
    data: string
}

export class CipheredFileAdapter extends FileAdapter {

    private key: CipherKey;

    constructor(key: CipherKey, filename: string, fsync: boolean) {
        super(filename, fsync)
        this.key = key
    }

    decrypt(data: CipheredData) {
        const decipher = createDecipheriv(
            ALGO,
            this.key,
            Buffer.from(data.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(data.data, 'hex')),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    }


    async readAsync(): Promise<string | null> {
        try {
            const rawData = await super.readAsync()
            if (rawData) {
                const cypheredData = JSON.parse(rawData)
                return this.decrypt(cypheredData as CipheredData)
            }
            return null          
        } catch (e) {
            throw e
        }
        
    }

    encrypt(data: string) {
        const iv = randomBytes(12); // 96 bits recommandé pour GCM
        const cipher = createCipheriv(ALGO, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(data, 'utf8'),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            data: encrypted.toString('hex')
        };
    }

    async writeAsync(data: string): Promise<void> {
        try {
            await super.writeAsync(JSON.stringify(this.encrypt(data)))
        } catch (err) {
            throw err
        }

    }

}