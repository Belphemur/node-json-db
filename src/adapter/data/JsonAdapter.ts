import {IAdapter} from "../IAdapter";

export class JsonAdapter implements IAdapter<any> {

    private readonly adapter: IAdapter<string>;
    private readonly humanReadable: boolean;


    constructor(adapter: IAdapter<string>, humanReadable: boolean = false) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
    }

    async readAsync(): Promise<any> {
        const data = await this.adapter.readAsync();
        if (data == null) {
            await this.writeAsync({});
            return {};
        }
        return JSON.parse(data);
    }

    writeAsync(data: any): Promise<void> {
        let stringify = '';
        if (this.humanReadable) {
            stringify = JSON.stringify(data, null, 4)
        } else {
            stringify = JSON.stringify(data)
        }
        return this.adapter.writeAsync(stringify);
    }

}