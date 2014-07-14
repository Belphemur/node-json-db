(function () {
    "use strict";
    var util = require("util");


    function NestedError(msg, id, nested) {
        var tmp = Error.apply(this, arguments);
        tmp.name = this.name = 'NestedError';

        this.stack = tmp.stack;
        this.message = tmp.message;
        this.inner = nested;
        this.id = id;
        return this;
    }

    util.inherits(NestedError, Error);

    NestedError.prototype.toString = function () {
        var string = this.name + ": " + this.message;
        if (this.inner) {
            return string + ':\n' + this.inner;
        }
        return string;
    }


    function DatabaseError(msg, id, nested) {
        var error = NestedError.call(this, msg, id, nested);
        error.name = 'DatabaseError';
        return error;
    }

    util.inherits(DatabaseError, NestedError);

    function DataError(msg, id, nested) {
        var error = NestedError.call(this, msg, id, nested);
        error.name = 'DataError';
        return error;
    }

    util.inherits(DataError, NestedError);


    exports = module.exports = {
        DatabaseError: DatabaseError,
        DataError: DataError
    }
})();
