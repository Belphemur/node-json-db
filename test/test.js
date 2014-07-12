var assert = require("assert");
var JsonDB = require("../JsonDB.js");
var fs = require('fs');
var util = require('util');

var testFile1 = "test_file1";
var testFile2 = "test_file2";
describe('JsonDB', function () {
    describe('Initialisation', function () {
        var db = new JsonDB(testFile1, true);
        db.on('error', function (error) {
            throw error;
        });
        it('should create the JSON File', function (done) {
            fs.exists(testFile1 + ".json", function (exists) {
                assert(exists, "File should exits");
                done();
            });

        })

        it('should set en empty root', function () {
            assert.equal("{}", JSON.stringify(db.getData("/")));
        })

    })
    describe('Data Management', function () {

        var db = new JsonDB(testFile2, true);

        it('should store the data at the root', function () {
            var object = {test: {test: "test"}};
            db.push("/", object);
            assert.strictEqual(db.getData("/"), object);
        })
        it('should override the data at the root', function () {
            var object = {test: "test"};
            db.push("/", object);
            assert.strictEqual(db.getData("/"), object);
        })
        it('should merge the data at the root', function () {
            var object = {test: {test: ['Okay']}};
            db.push("/", object);
            var data = db.getData("/");
            assert.strictEqual(data, object);
            object = {test: {test: ['Perfect'], okay: "test"}}
            db.push("/", object, false);
            assert.equal(JSON.stringify(db.getData("/")), '{\"test\":{\"test\":[\"Okay\",\"Perfect\"],\"okay\":\"test\"}}');
        })
        it('should return right data for datapath', function () {
            db = new JsonDB(testFile2, true);
            assert.equal(JSON.stringify(db.getData("/test")), '{\"test\":[\"Okay\",\"Perfect\"],\"okay\":\"test\"}');

        })

        it('should override only the data at datapath', function () {
            var data = ['overriden'];
            db.push("/test/test", data);
            assert.strictEqual(db.getData("/test/test"), data);
        })
        it('should merge the data at datapath', function () {
            var data = ['test2'];
            db.push("/test/test", data, false);
            assert.equal(JSON.stringify(db.getData("/test/test")), '[\"overriden\",\"test2\"]');
        })

        it('should throw an Error when merging Object with Array', function () {
            assert.throws(function () {
                db.push("/test/test", {myTest: "test"}, false);
            })
        })

        it('should delete the data', function () {
            db.delete("/test/test");
            assert.throws(function () {
                db.getData("/test/test");
            })
        })


    });
    describe('Cleanup', function () {
        it('should remove the test files', function () {
            fs.unlinkSync(testFile1 + ".json");
            fs.unlinkSync(testFile2 + ".json");
        });
    });

});