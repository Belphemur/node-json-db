import {DateSerializer, SetSerializer, MapSerializer, RegExpSerializer, BigIntSerializer, defaultSerializers} from "../../src/adapter/data/Serializers";

describe('Serializers', () => {
    describe('DateSerializer', () => {
        const serializer = new DateSerializer();

        test('should have type "Date"', () => {
            expect(serializer.type).toBe("Date");
        })

        test('should test Date instances', () => {
            expect(serializer.test(new Date())).toBe(true);
            expect(serializer.test(new Date("2023-01-01"))).toBe(true);
            expect(serializer.test("2023-01-01")).toBe(false);
            expect(serializer.test(Date.now())).toBe(false);
            expect(serializer.test(null)).toBe(false);
            expect(serializer.test(undefined)).toBe(false);
        })

        test('should serialize Date to ISO string', () => {
            const date = new Date("2023-06-15T12:00:00.000Z");
            const result = serializer.serialize(date);
            expect(result).toBe("2023-06-15T12:00:00.000Z");
        })

        test('should deserialize ISO string to Date', () => {
            const result = serializer.deserialize("2023-06-15T12:00:00.000Z");
            expect(result).toBeInstanceOf(Date);
            expect(result.toISOString()).toBe("2023-06-15T12:00:00.000Z");
        })
    })

    describe('SetSerializer', () => {
        const serializer = new SetSerializer();

        test('should have type "Set"', () => {
            expect(serializer.type).toBe("Set");
        })

        test('should test Set instances', () => {
            expect(serializer.test(new Set())).toBe(true);
            expect(serializer.test(new Set([1, 2]))).toBe(true);
            expect(serializer.test([])).toBe(false);
            expect(serializer.test({})).toBe(false);
            expect(serializer.test("set")).toBe(false);
            expect(serializer.test(null)).toBe(false);
            expect(serializer.test(undefined)).toBe(false);
        })

        test('should serialize Set to array', () => {
            const result = serializer.serialize(new Set([1, 2, 3]));
            expect(result).toEqual([1, 2, 3]);
        })

        test('should serialize empty Set to empty array', () => {
            const result = serializer.serialize(new Set());
            expect(result).toEqual([]);
        })

        test('should deserialize array to Set', () => {
            const result = serializer.deserialize([1, 2, 3]);
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(3);
            expect(result.has(1)).toBe(true);
        })

        test('should deserialize empty array to empty Set', () => {
            const result = serializer.deserialize([]);
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        })
    })

    describe('MapSerializer', () => {
        const serializer = new MapSerializer();

        test('should have type "Map"', () => {
            expect(serializer.type).toBe("Map");
        })

        test('should test Map instances', () => {
            expect(serializer.test(new Map())).toBe(true);
            expect(serializer.test(new Map([["a", 1]]))).toBe(true);
            expect(serializer.test([])).toBe(false);
            expect(serializer.test({})).toBe(false);
            expect(serializer.test("map")).toBe(false);
            expect(serializer.test(null)).toBe(false);
            expect(serializer.test(undefined)).toBe(false);
        })

        test('should serialize Map to array of entries', () => {
            const result = serializer.serialize(new Map([["a", 1], ["b", 2]]));
            expect(result).toEqual([["a", 1], ["b", 2]]);
        })

        test('should serialize empty Map to empty array', () => {
            const result = serializer.serialize(new Map());
            expect(result).toEqual([]);
        })

        test('should deserialize array of entries to Map', () => {
            const result = serializer.deserialize([["a", 1], ["b", 2]]);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
            expect(result.get("a")).toBe(1);
            expect(result.get("b")).toBe(2);
        })

        test('should deserialize empty array to empty Map', () => {
            const result = serializer.deserialize([]);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        })
    })

    describe('RegExpSerializer', () => {
        const serializer = new RegExpSerializer();

        test('should have type "RegExp"', () => {
            expect(serializer.type).toBe("RegExp");
        })

        test('should test RegExp instances', () => {
            expect(serializer.test(/abc/)).toBe(true);
            expect(serializer.test(new RegExp("abc"))).toBe(true);
            expect(serializer.test("abc")).toBe(false);
            expect(serializer.test({})).toBe(false);
            expect(serializer.test(null)).toBe(false);
            expect(serializer.test(undefined)).toBe(false);
        })

        test('should serialize RegExp to source and flags', () => {
            const result = serializer.serialize(/hello\s+world/gi);
            expect(result).toEqual({source: "hello\\s+world", flags: "gi"});
        })

        test('should serialize RegExp with no flags', () => {
            const result = serializer.serialize(/^test$/);
            expect(result).toEqual({source: "^test$", flags: ""});
        })

        test('should deserialize to RegExp', () => {
            const result = serializer.deserialize({source: "hello\\s+world", flags: "gi"});
            expect(result).toBeInstanceOf(RegExp);
            expect(result.source).toBe("hello\\s+world");
            expect(result.flags).toBe("gi");
            expect(result.test("Hello World")).toBe(true);
        })
    })

    describe('BigIntSerializer', () => {
        const serializer = new BigIntSerializer();

        test('should have type "BigInt"', () => {
            expect(serializer.type).toBe("BigInt");
        })

        test('should test bigint values', () => {
            expect(serializer.test(BigInt(42))).toBe(true);
            expect(serializer.test(BigInt("9007199254740993"))).toBe(true);
            expect(serializer.test(42)).toBe(false);
            expect(serializer.test("42")).toBe(false);
            expect(serializer.test(null)).toBe(false);
            expect(serializer.test(undefined)).toBe(false);
        })

        test('should serialize BigInt to string', () => {
            const result = serializer.serialize(BigInt("9007199254740993"));
            expect(result).toBe("9007199254740993");
        })

        test('should deserialize string to BigInt', () => {
            const result = serializer.deserialize("9007199254740993");
            expect(typeof result).toBe("bigint");
            expect(result).toBe(BigInt("9007199254740993"));
        })
    })

    describe('defaultSerializers', () => {
        test('should contain all built-in serializers', () => {
            expect(defaultSerializers).toHaveLength(5);
            expect(defaultSerializers[0]).toBeInstanceOf(DateSerializer);
            expect(defaultSerializers[1]).toBeInstanceOf(SetSerializer);
            expect(defaultSerializers[2]).toBeInstanceOf(MapSerializer);
            expect(defaultSerializers[3]).toBeInstanceOf(RegExpSerializer);
            expect(defaultSerializers[4]).toBeInstanceOf(BigIntSerializer);
        })

        test('all serializers should implement ISerializer', () => {
            for (const serializer of defaultSerializers) {
                expect(typeof serializer.type).toBe("string");
                expect(typeof serializer.serialize).toBe("function");
                expect(typeof serializer.deserialize).toBe("function");
                expect(typeof serializer.test).toBe("function");
            }
        })

        test('all serializers should have unique type identifiers', () => {
            const types = defaultSerializers.map(s => s.type);
            expect(new Set(types).size).toBe(types.length);
        })
    })
})
