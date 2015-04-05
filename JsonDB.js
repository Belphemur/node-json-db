(function () {
    "use strict";
    var FS = require('fs');
    var events = require('events');
    var util = require('util');
    var JsonUtils = require("./lib/utils");
    var DBParentData = require("./lib/DBParentData");
    var DatabaseError = require("./lib/Errors").DatabaseError;
    var DataError = require("./lib/Errors").DataError;
    var mkdirp = require('mkdirp');
    var path = require('path');

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
            mkdirp(dirname, function (err) {
                if (err) {
                    throw err;
                }
                self.save(true);
                self.loaded = true;
                util.log("[JsonDB] DataBase " + self.filename + " created.");
            });

        }
        this.saveOnPush = saveOnPush || true;
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
        return new DBParentData(last, this._getData(path, create), this);
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

        function recursiveProcessDataPath(data, index) {
            var property = dataPath[index];

            if (data.hasOwnProperty(property)) {
                data = data[property];
            } else if (create) {
                data[property] = {};
                data = data[property];
            } else {
                throw new DataError("Can't find dataPath: /" + dataPath.join("/") + ". Stopped at " + property, 5);
            }

            if(dataPath.length == ++index) {
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
        var dbData = this._getParentData(dataPath, true);
        if (!dbData) {
            return;
        }
        dbData.delete();
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
            util.log("[JsonDB] DataBase " + this.filename + " loaded.");
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