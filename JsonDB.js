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

    var JsonDB = function (filename, saveOnPush) {

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
        this.saveOnPush = saveOnPush;

        return this;
    };
    JsonDB.prototype.processDataPath = function (dataPath) {
        if (dataPath === undefined || !dataPath.trim()) {
            throw new DataError("The Data Path can't be empty", 6);
        }
        if (dataPath == "/") {
            return [];
        }
        var path = dataPath.split("/");
        path.shift();
        return path;
    }

    JsonDB.prototype.getParentData = function (dataPath, create) {
        var path = this.processDataPath(dataPath);
        var last = path.pop();
        return new DBParentData(last, this._getData(path, create), this);
    }

    JsonDB.prototype.getData = function (dataPath) {
        var path = this.processDataPath(dataPath);
        return this._getData(path);
    }

    JsonDB.prototype._getData = function (dataPath, create) {
        this.load();

        create = create || false;
        if (dataPath.length === 0) {
            return this.data;
        }
        var data = this.data;
        for (var i in dataPath) {
            if (dataPath.hasOwnProperty(i)) {
                var property = dataPath[i];
                if (data.hasOwnProperty(property)) {
                    data = data[property];
                } else if (create) {
                    data[property] = {};
                    data = data[property];
                } else {
                    throw new DataError("Can't find dataPath: /" + dataPath.join("/") + ". Stopped at " + property, 5);
                }
            }
        }
        return data;

    }
    JsonDB.prototype.push = function (dataPath, data, override) {
        override = override === undefined ? true : override;
        var dbData = this.getParentData(dataPath, true);
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
    }
    JsonDB.prototype.delete = function (dataPath) {
        var dbData = this.getParentData(dataPath, true);
        if (!dbData) {
            return;
        }
        dbData.delete();
    }

    JsonDB.prototype.reload = function () {
        this.loaded = false;
        return this.load();
    };

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
    }
    JsonDB.prototype.save = function (force) {
        force = force || false;
        if (!force && !this.loaded) {
            throw new DatabaseError("DataBase not loaded. Can't write", 7);
        }
        var data = "";
        try {
            data = JSON.stringify(this.data);
            FS.writeFileSync(this.filename, data, 'utf8');
        } catch (err) {
            var error = new DatabaseError("Can't save the database", 2, err);
            error.inner = err;
            throw error;
        }

    }

    exports = module.exports = JsonDB;
})();