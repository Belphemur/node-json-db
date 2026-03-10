/**
 * Contract for custom type serialization/deserialization.
 * Implement this interface to add support for custom types
 * that are not natively supported by JSON.
 *
 * Types are serialized using a `__type` discriminator:
 * ```json
 * { "__type": "TypeName", "__value": <serialized-data> }
 * ```
 */
export interface ISerializer {
    /**
     * Unique type identifier stored as `__type` in the serialized JSON.
     */
    readonly type: string;

    /**
     * Serialize a value to a JSON-compatible representation.
     * The returned value will be stored under `__value` in the serialized JSON.
     * @param value The value to serialize
     * @returns A JSON-compatible value
     */
    serialize(value: any): any;

    /**
     * Deserialize a value from its JSON representation.
     * The input is the `__value` from the serialized JSON.
     * @param value The stored JSON value
     * @returns The deserialized runtime value
     */
    deserialize(value: any): any;

    /**
     * Test if a runtime value should be handled by this serializer.
     * @param value The value to test
     * @returns true if this serializer should handle this value
     */
    test(value: any): boolean;
}
