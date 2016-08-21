(function () {
    "use strict";
    var ArrayInfo = require('./ArrayInfo');
    var arrayIndexRegex = /(.+)\[(.+|)\]/;
    var endsWith = function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };
    /**
     * Check if the property want to access an Array
     * @returns ArrayInfo|null
     */
    var processArray = function(property) {
        var match = arrayIndexRegex.exec(property);
        if (match != null) {
            return new ArrayInfo(match[1], match[2]);
        }
        return null;
    };
//
// Code from: https://github.com/rxaviers/cldr
//
    var merge = function () {
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
        if(dataPath.length > 1 && endsWith(dataPath,"/")) {
            return dataPath.substring(0, dataPath.length - 1);
        }
        return dataPath;
    }
    module.exports = {
        strEndWith: endsWith,
        mergeObject: merge,
        processArray: processArray,
        removeTrailingSlash : removeTrailingSlash
    }
})();