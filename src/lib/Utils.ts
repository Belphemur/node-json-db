export interface KeyValue {
    [key: string]: any
}

/**
 * True for an object made by `{}`, `Object.create(null)` or `JSON.parse`.
 * A Date, Map, Set, RegExp or class instance is not plain: copying its own
 * keys into `{}` would drop its value.
 */
export const isPlainObject = (value: any): value is KeyValue => {
    if (value === null || typeof value !== 'object') {
        return false
    }
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

export const merge = (...arrays: KeyValue[]): KeyValue => {
    const destination = {} as KeyValue
    arrays.forEach(function (source) {
        for (const prop of Object.keys(Object(source))) {
            // Read each value once, so a getter can't give the checks and the
            // stored value two different results.
            const value = source[prop]
            // Only own keys count: `__proto__` is inherited by every object.
            const exists = Object.prototype.hasOwnProperty.call(destination, prop)
            const stored = exists ? destination[prop] : undefined

            if (exists && stored === null) {
                setOwnProperty(destination, prop, value)
            }
            else if (exists && Array.isArray(stored)) {

                // Concat Arrays
                setOwnProperty(destination, prop, stored.concat(value))

            } else if (exists && isPlainObject(stored) && (value === null || value === undefined)) {

                // A null or undefined value doesn't wipe a stored object

            } else if (exists && isPlainObject(stored) && isPlainObject(value)) {

                // Merge Objects
                setOwnProperty(destination, prop, merge(stored, value))

            } else {

                // Set new values
                setOwnProperty(destination, prop, value)

            }
        }
    })
    return destination
}

/**
 * Set an own property, even for the key `__proto__`, where a plain
 * assignment would change the object's prototype instead.
 * Every other key uses a plain assignment, so existing property attributes
 * are kept (e.g. writing an array's non-configurable `length` truncates it).
 */
export const setOwnProperty = (target: any, key: string | number, value: any): void => {
    if (key === '__proto__') {
        Object.defineProperty(target, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
        })
        return
    }
    target[key] = value
}

export const removeTrailingChar = (dataPath: string, trailing: string): string => {
    if (dataPath.length > 1 && dataPath.endsWith(trailing)) {
        return dataPath.substring(0, dataPath.length - 1)
    }
    return dataPath
}