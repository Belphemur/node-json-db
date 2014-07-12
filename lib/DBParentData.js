function DBParentData(parent, data, jsonDB) {
    this.parent = parent;
    this.data = data;
    this.db = jsonDB;

}
DBParentData.prototype.getData = function () {
    if (this.parent === undefined) {
        return this.data;
    }
    return this.data[this.parent];
}

DBParentData.prototype.setData = function (toSet) {
    if (this.parent === undefined) {
        this.db.data = toSet;
    } else {
        this.data[this.parent] = toSet;
    }
}

DBParentData.prototype.delete = function () {
    if (this.parent === undefined) {
        this.db.data = {};
    }
    delete this.data[this.parent];
}

exports = module.exports = DBParentData;