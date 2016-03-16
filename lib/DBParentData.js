(function () {
    "use strict";
    var JsonUtils = require('./utils');
    var DataError = require("../lib/Errors").DataError;


    function DBParentData(parent, data, jsonDB, dataPath) {
        this.parent = parent;
        this.data = data;
        this.db = jsonDB;
        this.dataPath = dataPath;

    }

    /**
     * Check if the array is valid for the wanted use
     * @param deletion
     * @returns {ArrayInfo}
     * @private
     */
    DBParentData.prototype._checkArray = function (deletion) {
        if(typeof deletion === undefined) {
            deletion = false;
        }
        var arrayInfo = JsonUtils.processArray(this.parent);
        if (arrayInfo) {
            if ((!arrayInfo.append || deletion) && !arrayInfo.isValid(this.data)) {
                throw new DataError("DataPath: /" + this.dataPath + ". Can't find index " + arrayInfo.index + " in array " + arrayInfo.property, 10);
            }
        }
        return arrayInfo;
    };

    DBParentData.prototype.getData = function () {
        if (this.parent === undefined) {
            return this.data;
        }
        var arrayInfo = this._checkArray();
        if (arrayInfo) {
            return arrayInfo.getData(this.data);
        } else {
            return this.data[this.parent];
        }
    };

    DBParentData.prototype.setData = function (toSet) {
        if (this.parent === undefined) {
            this.db.data = toSet;
            return;
        }
        var arrayInfo = JsonUtils.processArray(this.parent);
        if (arrayInfo) {
            if (!this.data.hasOwnProperty(arrayInfo.property)) {
                this.data[arrayInfo.property] = [];
            } else if (!Array.isArray(this.data[arrayInfo.property])) {
                throw new DataError("DataPath: /" + this.dataPath + ". " + arrayInfo.property + " is not an array.", 11);
            }
            arrayInfo.setData(this.data, toSet);
        } else {
            this.data[this.parent] = toSet;
        }
    };

    DBParentData.prototype.delete = function () {
        if (this.parent === undefined) {
            this.db.data = {};
        }
        var arrayInfo = this._checkArray(true);
        if (arrayInfo) {
            arrayInfo.delete(this.data);
        } else {
            delete this.data[this.parent];
        }
    };

    module.exports = DBParentData;
})();