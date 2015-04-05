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

    DBParentData.prototype.getData = function () {
        if (this.parent === undefined) {
            return this.data;
        }
        return this.data[this.parent];
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
            } else if(!Array.isArray(this.data[arrayInfo.property])) {
                throw new DataError("DataPath: /" + this.dataPath + ". " + arrayInfo.property + " is not an array.", 11);
            }
            this.data[arrayInfo.property][arrayInfo.index] = toSet;
        } else {
            this.data[this.parent] = toSet;
        }
    };

    DBParentData.prototype.delete = function () {
        if (this.parent === undefined) {
            this.db.data = {};
        }
        var arrayInfo = JsonUtils.processArray(this.parent);
        if (arrayInfo) {
            delete this.data[arrayInfo.property][arrayInfo.index];
        } else {
            delete this.data[this.parent];
        }
    };

    exports = module.exports = DBParentData;
})();