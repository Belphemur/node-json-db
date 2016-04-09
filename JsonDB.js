(function () {
    "use strict";
    var FS = require('fs');
    var events = require('events');
    var JsonUtils = require("./lib/utils");
    var DBParentData = require("./lib/DBParentData");
    var DatabaseError = require("./lib/Errors").DatabaseError;
    var DataError = require("./lib/Errors").DataError;
    var mkdirp = require('mkdirp');
    var path = require('path');

    /**
     * Create the JSON database
     * @param filename where to save the data base
     * @param saveOnPush saving on modification of the data
     * @param humanReadable is the json file humand readable 
     * @returns {JsonDB}
     * @constructor
     */
    var JsonDB = function (filename, saveOnPush, humanReadable) {

        this.filename = filename;

        if (!JsonUtils.strEndWith(filename, ".json")) {
            this.filename += ".json";
        }
        var self = this;
        this.loaded = false;
        this.data = {};
        if (!FS.existsSync(this.filename)) {
            var dirname = path.dirname(this.filename);
            mkdirp.sync(dirname);
            self.save(true);
            self.loaded = true;
        }
        this.saveOnPush = ( typeof( saveOnPush ) == "boolean" ) ? saveOnPush : true;
        if (humanReadable) {
            this.humanReadable = humanReadable;
        }
        else {
            this.humanReadable = false;
        }

        return this;
    };
    JsonDB.prototype._processDataPath = function (dataPath) {
        if (dataPath === undefined || !dataPath.trim()) {
            throw new DataError("The Data Path can't be empty", 6);
        }
        if (dataPath == "/") {
            return [];
        }
        var path = dataPath.split("/");
        path.shift();
        return path;
    };

    JsonDB.prototype._getParentData = function (dataPath, create) {
        var path = this._processDataPath(dataPath);
        var last = path.pop();
        return new DBParentData(last, this._getData(path, create), this, dataPath);
    };
    /**
     * Get the deta stored in the data base
     * @param dataPath path leading to the data
     * @returns {*}
     */
    JsonDB.prototype.getData = function (dataPath) {
        var path = this._processDataPath(dataPath);
        return this._getData(path);
    };

    JsonDB.prototype._getData = function (dataPath, create) {

        this.load();

        create = create || false;
        dataPath = JsonUtils.removeTrailingSlash(dataPath);

        function recursiveProcessDataPath(data, index) {

            var property = dataPath[index];


            /**
             * Find the wanted Data or create it.
             */
            function findData(isArray) {
                isArray = isArray || false;
                if (data.hasOwnProperty(property)) {
                    data = data[property];
                } else if (create) {
                    if (isArray) {
                        data[property] = [];
                    } else {
                        data[property] = {};
                    }
                    data = data[property];
                } else {
                    throw new DataError("Can't find dataPath: /" + dataPath.join("/") + ". Stopped at " + property, 5);
                }
            }

            var arrayInfo = JsonUtils.processArray(property);
            if (arrayInfo) {
                property = arrayInfo.property;
                findData(true);
                if (!Array.isArray(data)) {
                    throw new DataError("DataPath: /" + dataPath.join("/") + ". " + property + " is not an array.", 11);
                }
                var arrayIndex = arrayInfo.getIndex(data, true);
                if (data.hasOwnProperty(arrayIndex)) {
                    data = data[arrayIndex];
                } else if (create) {
                    if (arrayInfo.append) {
                        data.push({});
                        data = data[data.length - 1];
                    }
                    else {
                        data[arrayIndex] = {};
                        data = data[arrayIndex];
                    }
                } else {
                    throw new DataError("DataPath: /" + dataPath.join("/") + ". Can't find index " + arrayInfo.index + " in array " + property, 10);
                }
            } else {
                findData();
            }

            if (dataPath.length == ++index) {
                return data;
            }
            return recursiveProcessDataPath(data, index);
        }

        if (dataPath.length === 0) {
            return this.data;
        }

        return recursiveProcessDataPath(this.data, 0);

    };

    /**
     * Pushing data into the database
     * @param dataPath path leading to the data
     * @param data data to push
     * @param override overriding or not the data, if not, it will merge them
     */
    JsonDB.prototype.push = function (dataPath, data, override) {
        override = override === undefined ? true : override;

        dataPath = JsonUtils.removeTrailingSlash(dataPath);
        var dbData = this._getParentData(dataPath, true);
        if (!dbData) {
            throw new Error("Data not found");
        }
        var toSet = data;
        if (!override) {
            if (Array.isArray(data)) {
                var storedData = dbData.getData();
                if (storedData === undefined) {
                    storedData = [];
                } else if (!Array.isArray(storedData)) {
                    throw new DataError("Can't merge another type of data with an Array", 3);
                }
                toSet = storedData.concat(data);
            } else if (data === Object(data)) {
                if (Array.isArray(dbData.getData())) {
                    throw  new DataError("Can't merge an Array with an Object", 4);
                }
                toSet = JsonUtils.mergeObject(dbData.getData(), data);
            }
        }
        dbData.setData(toSet);

        if (this.saveOnPush) {
            this.save();
        }
    };
    /**
     * Delete the data
     * @param dataPath path leading to the data
     */
    JsonDB.prototype.delete = function (dataPath) {
        dataPath = JsonUtils.removeTrailingSlash(dataPath);
        var dbData = this._getParentData(dataPath, true);
        if (!dbData) {
            return;
        }
        dbData.delete();
        
        if (this.saveOnPush) {
            this.save();
        }
    };
    /**
     * Reload the database from the file
     * @returns {*}
     */
    JsonDB.prototype.reload = function () {
        this.loaded = false;
        return this.load();
    };
    /**
     * Manually load the database
     * It is automatically called when the first getData is done
     */
    JsonDB.prototype.load = function () {
        if (this.loaded) {
            return;
        }
        try {
            var data = FS.readFileSync(this.filename, 'utf8');
            this.data = JSON.parse(data);
            this.loaded = true;
        } catch (err) {
            var error = new DatabaseError("Can't Load Database", 1, err);
            error.inner = err;
            throw error;
        }
    };
    /**
     * Manually save the database
     * By default you can't save the database if it's not loaded
     * @param force force the save of the database
     */
    JsonDB.prototype.save = function (force) {
        force = force || false;
        if (!force && !this.loaded) {
            throw new DatabaseError("DataBase not loaded. Can't write", 7);
        }
        var data = "";
        try {
            if (this.humanReadable) {
                data = JSON.stringify(this.data, null, 4);
            }
            else {
                data = JSON.stringify(this.data);
            }
            FS.writeFileSync(this.filename, data, 'utf8');
        } catch (err) {
            var error = new DatabaseError("Can't save the database", 2, err);
            error.inner = err;
            throw error;
        }

    };

    module.exports = JsonDB;
})();
