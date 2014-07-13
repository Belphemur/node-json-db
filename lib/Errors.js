var util = require("util");


function NestedError(msg, nested, id) {
    this.msg = msg;
    this.inner = nested;
    this.id = id;
}
util.inherits(NestedError, Error);

NestedError.prototype.toString = function () {
    if (this.inner) {
        return this.msg + this.inner;
    }
    return this.msg;
}


function DatabaseError(msg, nested, id) {
    this.msg = msg;
    this.inner = nested;
    this.id = id;
}
util.inherits(DatabaseError, NestedError);

function DataError(msg, nested, id) {
    this.msg = msg;
    this.inner = nested;
    this.id = id;
}
util.inherits(DataError, NestedError);


exports = module.exports = {
    DatabaseError: DatabaseError,
    DataError: DataError
}
