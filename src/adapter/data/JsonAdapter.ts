import {IAdapter} from "../IAdapter";
import {ISerializer} from "./ISerializer";
import {defaultSerializers} from "./Serializers";

export class JsonAdapter implements IAdapter<any> {

    private readonly adapter: IAdapter<string>;
    private readonly humanReadable: boolean;
    private readonly serializers: ISerializer[];


    /**
     * @param adapter The underlying string adapter for reading/writing raw data
     * @param humanReadable Whether to pretty-print the JSON output
     * @param parseDates Whether to serialize/deserialize Date objects (default: true).
     *   When true, a DateSerializer is included in the serializer list.
     *   When false, Date objects are excluded from serialization.
     * @param serializers Custom serializers for complex types (default: Date, Set, Map).
     *   When providing custom serializers, the parseDates flag still controls
     *   whether the DateSerializer is included.
     */
    constructor(adapter: IAdapter<string>, humanReadable: boolean = false, parseDates: boolean = true, serializers: ISerializer[] = defaultSerializers) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
        if (parseDates) {
            this.serializers = serializers;
        } else {
            this.serializers = serializers.filter(s => s.type !== "Date");
        }
    }

    async readAsync(): Promise<any> {
        const data = await this.adapter.readAsync();
        if (data == null || data === '') {
            await this.writeAsync({});
            return {};
        }
        const serializers = this.serializers;
        const reviver = function (key: string, value: any): any {
            if (value !== null && typeof value === 'object' && '__type' in value && '__value' in value) {
                for (const serializer of serializers) {
                    if (value.__type === serializer.type) {
                        return serializer.deserialize(value.__value);
                    }
                }
            }
            return value;
        };
        return JSON.parse(data, reviver);
    }

    writeAsync(data: any): Promise<void> {
        const serializers = this.serializers;
        const replacer = function (this: any, key: string, value: any): any {
            const rawValue = this[key];
            for (const serializer of serializers) {
                if (rawValue !== null && rawValue !== undefined && serializer.test(rawValue)) {
                    return {__type: serializer.type, __value: serializer.serialize(rawValue)};
                }
            }
            return value;
        };
        let stringify = '';
        if (this.humanReadable) {
            stringify = JSON.stringify(data, replacer, 4)
        } else {
            stringify = JSON.stringify(data, replacer)
        }
        return this.adapter.writeAsync(stringify);
    }

}