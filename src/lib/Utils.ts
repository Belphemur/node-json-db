export interface KeyValue {
    [key: string]: any
}

export const merge = (...arrays: KeyValue[]): KeyValue => {
    const destination = {} as KeyValue
    arrays.forEach(function (source) {
        var prop
        for (prop in source) {

            if (prop in destination && destination[prop] === null) {
                destination[prop] = source[prop]
            }
            else if (prop in destination && Array.isArray(destination[prop])) {

                // Concat Arrays
                destination[prop] = destination[prop].concat(source[prop])

            } else if (prop in destination && typeof destination[prop] === "object") {

                // Merge Objects
                destination[prop] = merge(destination[prop], source[prop])

            } else {

                // Set new values
                destination[prop] = source[prop]

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