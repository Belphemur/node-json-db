(function () {
    "use strict";
    const ArrayInfo = require('./ArrayInfo');
    const endsWith = function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };
    const regexCache = {};
    /**
     * Check if the property want to access an Array
     * @returns ArrayInfo|null
     */
    const processArray = function (property) {
        if (typeof property === 'undefined') {
             return null;
        }

        if (regexCache[property]) {
            return regexCache[property];
        }

        const arrayIndexRegex = arrayRegex();
        var match = arrayIndexRegex.exec(property.trim());
        if (match != null) {
            return (regexCache[property] = new ArrayInfo(match[1], match[2]));
        }
        return null;
    };

    const arrayRegex = function () {
        return /^([a-zA-Z_$][0-9a-zA-Z_$]*)\[((?!(\]|\[)).*|)\]$/gm;
    };
//
// Code from: https://github.com/rxaviers/cldr
//
    const merge = function () {
        var destination = {},
            sources = [].slice.call(arguments, 0);
        sources.forEach(function (source) {
            var prop;
            for (prop in source) {

                if (prop in destination && destination[prop] === null) {
                    destination[prop] = source[prop];
                }
                else if (prop in destination && Array.isArray(destination[prop])) {

                    // Concat Arrays
                    destination[prop] = destination[prop].concat(source[prop]);

                } else if (prop in destination && typeof destination[prop] === "object") {

                    // Merge Objects
                    destination[prop] = merge(destination[prop], source[prop]);

                } else {

                    // Set new values
                    destination[prop] = source[prop];

                }
            }
        });
        return destination;
    };

    function removeTrailingSlash(dataPath) {
        if (dataPath.length > 1 && endsWith(dataPath, "/")) {
            return dataPath.substring(0, dataPath.length - 1);
        }
        return dataPath;
    }

    module.exports = {
        strEndWith: endsWith,
        mergeObject: merge,
        processArray: processArray,
        removeTrailingSlash: removeTrailingSlash,
        arrayRegex: arrayRegex
    }
})();
