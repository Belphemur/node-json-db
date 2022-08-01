import {IAdapter} from "../IAdapter";
import {DataError} from "../../lib/Errors";

export class JsonAdapter implements IAdapter<any> {

    private readonly adapter: IAdapter<string>;
    private readonly humanReadable: boolean;


    constructor(adapter: IAdapter<string>, humanReadable: boolean) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
    }

    async readAsync(): Promise<any> {
        const data = await this.adapter.readAsync();
        if (data == null) {
            throw new DataError("Can't Load Database", 1);
        }
        return JSON.parse(data);
    }

    writeAsync(data: any): Promise<void> {
        if (this.humanReadable) {
            data = JSON.stringify(data, null, 4)
        } else {
            data = JSON.stringify(data)
        }
        return this.adapter.writeAsync(data);
    }

}