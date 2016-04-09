/**
 * Created by Antoine on 20/02/2016.
 */
(function () {
    "use strict";
    var DataError = require("../lib/Errors").DataError;

    function isInt(value) {
        return !isNaN(value) &&
            parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
    }


    function ArrayInfo(property, index) {
        this.property = property;
        this.index = index;
        this.append = index === "";
        if (isInt(this.index)) {
            this.index = parseInt(this.index);
        } else if (!this.append) {
            throw new DataError("Only numerical values accepted for array index", 200)
        }
    }

    /**
     * Get the index for the array
     * @param data
     * @param avoidProperty
     * @returns {*}
     */
    ArrayInfo.prototype.getIndex = function (data, avoidProperty) {
        if (avoidProperty === undefined) {
            avoidProperty = false;
        }
        var index = this.index;
        if (index == -1) {
            var dataIterable = avoidProperty ? data : data[this.property];

            if (dataIterable.length === 0) {
                return 0;
            }
            return dataIterable.length - 1;
        }
        return index;
    };

    /**
     * Get the Data
     * @param data
     * @returns {*}
     * @constructor
     */
    ArrayInfo.prototype.getData = function (data) {
        if (this.append) {
            throw new DataError("Can't get data when appending", 100);
        }
        var index = this.getIndex(data);
        return data[this.property][index];
    };

    /**
     * Set the data for the array
     * @param data
     * @param value
     */
    ArrayInfo.prototype.setData = function (data, value) {
        if (this.append) {
            data[this.property].push(value);
        } else {
            var index = this.getIndex(data);
            data[this.property][index] = value;
        }
    };

    /**
     * Delete the index from the array
     * @param data
     */
    ArrayInfo.prototype.delete = function (data) {
        var index = this.getIndex(data);
        data[this.property].splice(index, 1);
    };

    /**
     * Check if the ArrayInfo is valid for the given data
     * @param data
     * @returns {boolean}
     * @constructor
     */
    ArrayInfo.prototype.isValid = function (data) {
        var index = this.getIndex(data);
        return data[this.property].hasOwnProperty(index);
    };


    module.exports = ArrayInfo;
})();