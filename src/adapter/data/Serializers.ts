import {ISerializer} from "#/adapter/data/ISerializer.js";

/**
 * Serializer for JavaScript Date objects.
 * Serializes a Date as an ISO 8601 string.
 *
 * @example
 * ```json
 * { "__type": "Date", "__value": "2023-01-01T00:00:00.000Z" }
 * ```
 */
export class DateSerializer implements ISerializer {
    readonly type = "Date";

    serialize(value: Date): string {
        return value.toISOString();
    }

    deserialize(value: string): Date {
        return new Date(value);
    }

    test(value: any): boolean {
        return value instanceof Date;
    }
}

/**
 * Serializer for JavaScript Set objects.
 * Serializes a Set as an array of its values.
 *
 * @example
 * ```json
 * { "__type": "Set", "__value": [1, 2, 3] }
 * ```
 */
export class SetSerializer implements ISerializer {
    readonly type = "Set";

    serialize(value: Set<any>): any[] {
        return [...value];
    }

    deserialize(value: any[]): Set<any> {
        return new Set(value);
    }

    test(value: any): boolean {
        return value instanceof Set;
    }
}

/**
 * Serializer for JavaScript Map objects.
 * Serializes a Map as an array of key-value pairs.
 *
 * @example
 * ```json
 * { "__type": "Map", "__value": [["key1", "value1"], ["key2", "value2"]] }
 * ```
 */
export class MapSerializer implements ISerializer {
    readonly type = "Map";

    serialize(value: Map<any, any>): [any, any][] {
        return [...value];
    }

    deserialize(value: [any, any][]): Map<any, any> {
        return new Map(value);
    }

    test(value: any): boolean {
        return value instanceof Map;
    }
}

/**
 * Serializer for JavaScript RegExp objects.
 * Serializes a RegExp as an object with source and flags.
 *
 * @example
 * ```json
 * { "__type": "RegExp", "__value": { "source": "hello\\s+world", "flags": "gi" } }
 * ```
 */
export class RegExpSerializer implements ISerializer {
    readonly type = "RegExp";

    serialize(value: RegExp): { source: string; flags: string } {
        return {source: value.source, flags: value.flags};
    }

    deserialize(value: { source: string; flags: string }): RegExp {
        return new RegExp(value.source, value.flags);
    }

    test(value: any): boolean {
        return value instanceof RegExp;
    }
}

/**
 * Serializer for JavaScript BigInt values.
 * Serializes a BigInt as a string representation.
 *
 * @example
 * ```json
 * { "__type": "BigInt", "__value": "9007199254740993" }
 * ```
 */
export class BigIntSerializer implements ISerializer {
    readonly type = "BigInt";

    serialize(value: bigint): string {
        return value.toString();
    }

    deserialize(value: string): bigint {
        return BigInt(value);
    }

    test(value: any): boolean {
        return typeof value === 'bigint';
    }
}

/**
 * Default serializers included with the JsonAdapter.
 * Provides built-in support for Date, Set, Map, RegExp, and BigInt types.
 *
 * This array is frozen (immutable). To extend it with your own serializers,
 * spread it into a new array:
 * ```typescript
 * import { defaultSerializers, ISerializer } from 'node-json-db';
 *
 * const mySerializer: ISerializer = {
 *   type: "MyType",
 *   serialize: (value) => value.toJSON(),
 *   deserialize: (value) => MyType.fromJSON(value),
 *   test: (value) => value instanceof MyType,
 * };
 *
 * // Use with Config.addSerializer() or spread into a custom list:
 * const serializers = [...defaultSerializers, mySerializer];
 * ```
 */
export const defaultSerializers: readonly ISerializer[] = Object.freeze([
    new DateSerializer(),
    new SetSerializer(),
    new MapSerializer(),
    new RegExpSerializer(),
    new BigIntSerializer(),
]);
