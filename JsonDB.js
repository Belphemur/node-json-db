var FS = require('fs');
var events = require('events');
var util = require('util');
var JsonUtils = require("./lib/utils");
var DBParentData = require("./lib/DBParentData");

var JsonDB = function (filename, saveOnPush) {

    events.EventEmitter.call(this);
    this.filename = filename;

    if (!JsonUtils.strEndWith(filename, ".json")) {
        this.filename += ".json";
    }
    var self = this;
    this.loaded = false;
    this.data = {};
    if (!FS.existsSync(this.filename)) {
        self.save(true);
        self.loaded = true;
        util.log("[JsonDB] DataBase " + self.filename + " created.");
    }
    this.saveOnPush = saveOnPush;

    return this;
};
util.inherits(JsonDB, events.EventEmitter);
JsonDB.prototype.processDataPath = function (dataPath) {
    if (dataPath === undefined || !dataPath.trim()) {
        this.emit('error', new Error("The Data Path can't be empty"));
        return;
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
    if (path === undefined) {
        return;
    }
    var last = path.pop();
    return new DBParentData(last, this._getData(path, create), this);
}

JsonDB.prototype.getData = function (dataPath) {
    var path = this.processDataPath(dataPath);
    if (path === undefined) {
        return;
    }
    return this._getData(path);
}

JsonDB.prototype._getData = function (dataPath, create) {
    this.load();

    create = create || false;
    if (dataPath.length == 0) {
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
                var error = new Error("Can't find dataPath: " + dataPath.join("/") + ". Stopped at " + property);
                this.emit('error', error);
                return;
            }
        }
    }
    return data;

}
JsonDB.prototype.push = function (dataPath, data, override) {
    override = override === undefined ? true : override;
    var dbData = this.getParentData(dataPath, true);
    if (!dbData) {
        this.emit('error', new Error("Data not found"));
        return;
    }
    var toSet = data;
    if (!override) {
        if (Array.isArray(data)) {
            var storedData = dbData.getData();
            if (storedData === undefined) {
                storedData = [];
            } else if (!Array.isArray(storedData)) {
                this.emit('error', new Error("Can't merge another type of data with an Array"));
                return;
            }
            toSet = storedData.concat(data);
        } else if (data === Object(data)) {
            if (Array.isArray(dbData.getData())) {
                this.emit('error', new Error("Can't merge an Array with an Object"));
                return;
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
        var error = new Error("Can't Load Database: " + err);
        error.inner = err;
        this.emit('error', error);
    }
}
JsonDB.prototype.save = function (force) {
    force = force || false;
    if (!force && !this.loaded) {
        this.emit('error', new Error("DataBase not loaded. Can't write"));
        return;
    }
    var data = "";
    try {
        data = JSON.stringify(this.data);
        FS.writeFileSync(this.filename, data, 'utf8');
    } catch (err) {
        var error = new Error("Can't save the database: " + err);
        error.inner = err;
        this.emit('error', error);
    }

}

exports = module.exports = JsonDB;