var expect = require("expect.js");
var JsonDB = require("../JsonDB.js");
var DatabaseError = require("../lib/Errors").DatabaseError;
var DataError = require("../lib/Errors").DataError;

var fs = require('fs');
var util = require('util');

var testFile1 = "test_file1";
var testFile2 = "test_file2";
var faulty = "test/faulty.json";
describe('JsonDB', function () {
    describe('Initialisation', function () {
        var db = new JsonDB(testFile1, true);

        it('should create the JSON File', function (done) {
            fs.exists(testFile1 + ".json", function (exists) {
                expect(exists).to.be.ok();
                done();
            });

        })

        it('should set en empty root', function () {
            expect(JSON.stringify(db.getData("/"))).to.eql("{}");
        })

        it('should return a DatabaseError when loading faulty file', function () {
            db = new JsonDB(faulty, true);
            expect(function (args) {
                db.getData(args);
            }).withArgs("/").to.throwException(function (e) {
                    expect(e).to.be.a(DatabaseError);
                });

        })
        it('should return a DatabaseError when saving without successful loading.', function () {
            expect(db.save).to.throwException(function (e) {
                expect(e).to.be.a(DatabaseError);
            });
        })

    })
    describe('Data Management', function () {

        var db = new JsonDB(testFile2, true);

        it('should store the data at the root', function () {
            var object = {test: {test: "test"}};
            db.push("/", object);
            expect(db.getData("/")).to.be(object);
        })
        it('should override the data at the root', function () {
            var object = {test: "test"};
            db.push("/", object);
            expect(db.getData("/")).to.be(object);
        })
        it('should merge the data at the root', function () {
            var object = {test: {test: ['Okay']}};
            db.push("/", object);
            var data = db.getData("/");
            expect(data).to.be(object);
            object = {test: {test: ['Perfect'], okay: "test"}}
            db.push("/", object, false);
            expect(JSON.stringify(db.getData("/"))).to.eql('{\"test\":{\"test\":[\"Okay\",\"Perfect\"],\"okay\":\"test\"}}');
        })
        it('should return right data for datapath', function () {
            db = new JsonDB(testFile2, true);
            expect(JSON.stringify(db.getData("/test"))).to.eql('{\"test\":[\"Okay\",\"Perfect\"],\"okay\":\"test\"}');
        })

        it('should override only the data at datapath', function () {
            var object = ['overriden'];
            db.push("/test/test", object);
            expect(db.getData("/test/test")).to.be(object);
        })
        it('should merge the data at datapath', function () {
            var object = ['test2'];
            db.push("/test/test", object, false);
            expect(JSON.stringify(db.getData("/test/test"))).to.eql('[\"overriden\",\"test2\"]');
        })

        it('should create the tree to reach datapath', function () {
            var object = ['test2'];
            db.push("/my/tree/is/awesome", object, false);
            expect(JSON.stringify(db.getData("/my/tree/is/awesome"))).to.eql('[\"test2\"]');
        })
        it('should throw an Error when merging Object with Array', function () {
            expect(function (path, data, override) {
                db.push(path, data, override);
            }).withArgs("/test/test", {myTest: "test"}, false).to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                });
        })

        it('should throw an Error when merging Array with Object', function () {
            expect(function (path, data, override) {
                db.push(path, data, override);
            }).withArgs("/test", ['test'], false).to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                });
        })


        it('should throw an Error when asking for empty datapath', function () {
            expect(function (args) {
                db.getData(args);
            }).withArgs("").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                });

        })

        it('should delete the data', function () {
            db.delete("/test/test");
            expect(function (args) {
                db.getData(args);
            }).withArgs("/test/test").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                });

        })


    });
    describe('Cleanup', function () {
        it('should remove the test files', function () {
            fs.unlinkSync(testFile1 + ".json");
            fs.unlinkSync(testFile2 + ".json");
        });
    });

});