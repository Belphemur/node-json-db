/**
 * Created by Antoine on 20/02/2016.
 */
(function () {
    "use strict";
    function ArrayInfo(property, index) {
        this.property = property;
        this.index = index;
        this.append = index === "";
    }

    module.exports = ArrayInfo;
})();