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
            // Only own keys count: `__proto__` is inherited by every object.
            const exists = Object.prototype.hasOwnProperty.call(destination, prop)

            if (exists && destination[prop] === null) {
                setOwnProperty(destination, prop, source[prop])
            }
            else if (exists && Array.isArray(destination[prop])) {

                // Concat Arrays
                setOwnProperty(destination, prop, destination[prop].concat(source[prop]))

            } else if (exists && isPlainObject(destination[prop]) && isPlainObject(source[prop])) {

                // Merge Objects
                setOwnProperty(destination, prop, merge(destination[prop], source[prop]))

            } else {

                // Set new values
                setOwnProperty(destination, prop, source[prop])

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