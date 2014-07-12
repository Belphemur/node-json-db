var endsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
//
// Code from: https://github.com/rxaviers/cldr
//
var merge = function () {
    var destination = {},
        sources = [].slice.call(arguments, 0);
    sources.forEach(function (source) {
        var prop;
        for (prop in source) {
            if (prop in destination && Array.isArray(destination[ prop ])) {

                // Concat Arrays
                destination[ prop ] = destination[ prop ].concat(source[ prop ]);

            } else if (prop in destination && typeof destination[ prop ] === "object") {

                // Merge Objects
                destination[ prop ] = merge(destination[ prop ], source[ prop ]);

            } else {

                // Set new values
                destination[ prop ] = source[ prop ];

            }
        }
    });
    return destination;
};

exports = module.exports = {
    strEndWith: endsWith,
    mergeObject: merge
}