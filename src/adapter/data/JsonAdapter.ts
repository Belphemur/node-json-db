import {IAdapter} from "../IAdapter";
import {ISerializer} from "./ISerializer";
import {defaultSerializers} from "./Serializers";

export class JsonAdapter implements IAdapter<any> {

    private readonly adapter: IAdapter<string>;
    private readonly humanReadable: boolean;
    private readonly serializers: readonly ISerializer[];
    private readonly serializerMap: ReadonlyMap<string, ISerializer>;


    /**
     * @param adapter The underlying string adapter for reading/writing raw data
     * @param humanReadable Whether to pretty-print the JSON output
     * @param serializers Custom serializers for complex types (default: Date, Set, Map, RegExp, BigInt).
     */
    constructor(adapter: IAdapter<string>, humanReadable: boolean = false, serializers: readonly ISerializer[] = defaultSerializers) {
        this.adapter = adapter;
        this.humanReadable = humanReadable;
        this.serializers = serializers;
        this.serializerMap = new Map(serializers.map(s => [s.type, s]));
    }

    async readAsync(): Promise<any> {
        const data = await this.adapter.readAsync();
        if (data == null || data === '') {
            await this.writeAsync({});
            return {};
        }
        const serializerMap = this.serializerMap;
        const reviver = function (key: string, value: any): any {
            if (value !== null && typeof value === 'object' && '__type' in value) {
                // Un-escape user data that naturally contained __type
                if (typeof value.__type === 'object' && value.__type !== null && '__escaped' in value.__type) {
                    return {...value, __type: value.__type.__escaped};
                }
                // Deserialize known serialized types
                if ('__value' in value) {
                    const serializer = serializerMap.get(value.__type);
                    if (serializer) {
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
            // Escape plain objects that naturally contain __type to prevent false deserialization
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && '__type' in value) {
                return {...value, __type: {__escaped: value.__type}};
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