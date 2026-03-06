import {IAdapter} from "../IAdapter";

export class JsonAdapter implements IAdapter<any> {

    private readonly adapter: IAdapter<string>;
    private readonly humanReadable: boolean;
    private readonly dateRegex = new RegExp('^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}', 'm')
    private readonly parseDates: boolean;


    constructor(adapter: IAdapter<string>, humanReadable: boolean = false, parseDates: boolean = true) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
        this.parseDates = parseDates;
    }

    private replacer(key: string, value: any): any {
        if (value instanceof Map) {
            return Object.fromEntries(value);
        }
        return value;
    }

    private reviver(key: string, value: any): any {
        if (this.parseDates && typeof value == "string" && this.dateRegex.test(value)) {
            return new Date(value);
        }
        return value;
    }

    async readAsync(): Promise<any> {
        const data = await this.adapter.readAsync();
        if (data == null || data === '') {
            await this.writeAsync({});
            return {};
        }
        return JSON.parse(data, this.reviver.bind(this));
    }

    writeAsync(data: any): Promise<void> {
        let stringify = '';
        if (this.humanReadable) {
            stringify = JSON.stringify(data, this.replacer.bind(this), 4)
        } else {
            stringify = JSON.stringify(data, this.replacer.bind(this))
        }
        return this.adapter.writeAsync(stringify);
    }

}