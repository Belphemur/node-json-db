var expect = require("expect.js");
var JsonDB = require("../JsonDB.js");
var DatabaseError = require("../lib/Errors").DatabaseError;
var DataError = require("../lib/Errors").DataError;

var fs = require('fs');

var testFile1 = "test/test_file1";
var testFile2 = "test/dirCreation/test_file2";
var faulty = "test/faulty.json";
var testFile3 = "test/test_file3";
var testFile4 = "test/array_file";
var testFile5 = "test/test_file_empty";
var testFile6 = "test/test_delete";
describe('JsonDB', function () {
    describe('Exception/Error', function () {
        it('should create create a DataError', function () {
            var error = new DataError("Test", 5);
            expect(error).to.have.property("message", "Test");
            expect(error).to.have.property("id", 5);
            expect(error).to.have.property("inner");
            expect(error.toString()).to.eql("DataError: Test");
        })

        it('should create create a DatabaseError', function () {
            var nested = new Error("don't work");
            var error = new DatabaseError("Test", 5, nested);
            expect(error).to.have.property("message", "Test");
            expect(error).to.have.property("id", 5);
            expect(error).to.have.property("inner", nested);
            expect(error.toString()).to.eql("DatabaseError: Test:\nError: don't work");
        })

    });
    describe('Initialisation', function () {
        var db = new JsonDB(testFile1, true, true);

        it('should create the JSON File', function (done) {
            fs.exists(testFile1 + ".json", function (exists) {
                expect(exists).to.be.ok();
                done();
            });

        })

        it('should create the JSON File when called directly', function (done) {
            var jsondb = new JsonDB(testFile5, true, false);
            fs.exists(testFile5 + ".json", function (exists) {
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
        it('should remove trailing Slash when pushing/getting data (/)', function () {
            var object = {test: {test: "test"}};
            db.push("/testing/", object);
            expect(db.getData("/testing")).to.be(object);
        })

        it('should remove trailing Slash when deleting data (/)', function () {
            db.delete("/testing/");
            expect(function (args) {
                db.getData(args);
            }).withArgs("/testing/").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
            });
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

        it('should override a null variable when merging', function () {
            var replacement = {a:'test'};
            db.push('/null', {a:null}, false);
            db.push('/null', replacement, false);
            var data = db.getData('/null');
            expect(data['a']).to.be(replacement['a']);
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

        it('should reload the file', function () {
            var data = JSON.stringify({test: "Okay", perfect: 1});
            fs.writeFileSync(testFile2 + ".json", data, 'utf8');
            db.reload();
            expect(db.getData("/test")).to.be("Okay");
            expect(db.getData("/perfect")).to.be(1);
        })
    });

    describe('Human Readable', function () {
        var db = new JsonDB(testFile3, true, true);
        it('should save the data in an human readable format', function (done) {
            var object = {test: {readable: "test"}};
            db.push("/", object);
            fs.readFile(testFile3 + ".json", "utf8", function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data).to.be(JSON.stringify(object, null, 4));
                done();
            });
        })

    });
    describe('Array Support', function () {
        var db = new JsonDB(testFile4, true);
        it('should create an array with a string at index 0', function () {
            db.push('/arraytest/myarray[0]', "test", true);
            var myarray = db.getData('/arraytest/myarray');
            expect(myarray).to.be.an('array');
            expect(myarray[0]).to.be('test');
        });

        it('should throw an Error when using an array with a string at index TEST', function () {
            expect(function (args) {
                db.push('/arraytest/myarray[TEST]', "works", true);
            }).withArgs("/arraytest/arrayTesting[1]").to.throwException(function (e) {
                expect(e).to.be.a(DataError);
                expect(e).to.have.property('id', 200);
            });
        });

        it('should add an object at index 1', function () {
            var obj = {property: "perfect"};
            db.push('/arraytest/myarray[1]', obj, true);
            var myarray = db.getData('/arraytest/myarray');
            expect(myarray).to.be.an('array');
            expect(myarray[1]).to.be(obj);
        });

        it('should create a nested array with an object at index 0', function () {
            var data = {test: "works"};
            db.push('/arraytest/nested[0]/obj', data, true);
            var obj = db.getData('/arraytest/nested[0]');
            expect(obj).to.be.an('object');
            expect(obj).to.have.property('obj', data);
        });

        it('should access the object at index 1', function () {
            var obj = db.getData('/arraytest/myarray[1]');
            expect(obj).to.be.an('object');
            expect(obj).to.have.property('property', 'perfect');

        });
        it('should access the object property at index 1', function () {
            var property = db.getData('/arraytest/myarray[1]/property');
            expect(property).to.be.a('string');
            expect(property).to.be('perfect');
        });

        it('should throw an error when accessing non-present index', function () {
            var obj = {property: "perfect"};
            db.push('/arraytest/arrayTesting[0]', obj, true);
            expect(function (args) {
                db.getData(args);
            }).withArgs("/arraytest/arrayTesting[1]").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 10);
                });
        });

        it('should delete the object at index 1', function () {
            db.delete('/arraytest/myarray[1]');
            expect(function (args) {
                db.getData(args);
            }).withArgs("/arraytest/myarray[1]").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 10);
                });
        });

        it('should throw an error when deleting non-present index', function () {
            expect(function (args) {
                db.delete(args);
            }).withArgs("/arraytest/myarray[10]").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 10);
                });
        });

        it('should throw an error when trying to set an object as an array', function () {
            db.push('/arraytest/fakearray', {fake: "fake"}, true);
            expect(function (args) {
                db.push(args, {test: 'test'}, true);
            }).withArgs("/arraytest/fakearray[1]").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 11);
                });
        });

        it('should throw an error when trying to access an object as an array', function () {
            db.push('/arraytest/fakearray', {fake: "fake"}, true);
            expect(function (args) {
                db.getData(args);
            }).withArgs("/arraytest/fakearray[1]").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 11);
                });
        });
        it('should throw an error when trying to set an object as an array (2)', function () {
            db.push('/arraytest/fakearray', {fake: "fake"}, true);
            expect(function (args) {
                db.push(args, {test: 'test'}, true);
            }).withArgs("/arraytest/fakearray[1]/fake").to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 11);
            });
        });

        it('should merge nested arrays', function () {
            db.push('/merging/array[0]', ['test']);
            db.push('/merging/array[0]', ['secondTest'], false);
            var data = db.getData('/merging/array[0]');
            expect(data).to.be.an('array');
            expect(data).to.contain('test');
            expect(data).to.contain('secondTest');
        });

        it('should remove the index of an array, not set it to null', function () {
            db.push('/deleteTest/array[0]', 'test');
            db.push('/deleteTest/array[1]', 'test2');
            db.delete('/deleteTest/array[1]');
            db.save(true);
            var json = JSON.parse(fs.readFileSync(testFile4+'.json'));
            expect(json.deleteTest).to.be.an('object');
            expect(json.deleteTest.array).to.be.an('array');
            expect(json.deleteTest.array[0]).to.be('test');
            expect(json.deleteTest.array[1]).to.be(undefined);
        });

        it('should append a value to the existing array', function () {
            db.push('/arraytest/appendArray', [0], true);
            db.push('/arraytest/appendArray[]', 1, true);
            var array = db.getData('/arraytest/appendArray');
            expect(array).to.be.an('array');
            var index1 = db.getData('/arraytest/appendArray[1]');
            expect(index1).to.be(1);
        });

        it('should throw an error when deleting a append command', function () {
            expect(function (args) {
                db.delete(args);
            }).withArgs("/arraytest/appendArray[]").to.throwException(function (e) {
                expect(e).to.be.a(DataError);
                expect(e).to.have.property('id', 10);
            });
        });

        it('should append a value to the existing array and create property', function () {
            db.push('/arraytest/appendArray2', [0], true);
            db.push('/arraytest/appendArray2[]/test', 1, true);
            var array = db.getData('/arraytest/appendArray2');
            expect(array).to.be.an('array');
            var index1 = db.getData('/arraytest/appendArray2[1]/test');
            expect(index1).to.be(1);
        });

        it('should throw an error when trying to append to a non array', function () {
            db.push('/arraytest/fakearray', {fake: "fake"}, true);
            expect(function (args) {
                db.push(args, {test: 'test'}, true);
            }).withArgs("/arraytest/fakearray[]/fake").to.throwException(function (e) {
                expect(e).to.be.a(DataError);
                expect(e).to.have.property('id', 11);
            });
        });
        describe('last item', function () {

            it('should throw an exception when array is empty when using -1', function () {
                db.push('/arraylast/myarrayempty', [], true);
                expect(function (args) {
                    db.getData(args);
                }).withArgs('/arraylast/myarrayempty[-1]').to.throwException(function (e) {
                    expect(e).to.be.a(DataError);
                    expect(e).to.have.property('id', 10);
                });
            });

            it('should set the fist item when using -1 on empty array', function () {
                db.push('/arraylast/emptyArray', [], true);
                db.push('/arraylast/emptyArray[-1]', 3);
                var lastItem = db.getData('/arraylast/emptyArray[0]');
                expect(lastItem).to.be(3);
            });

            it('should return the last key when using -1', function () {
                db.push('/arraylast/myarray', [1, 2, 3], true);
                var lastItem = db.getData('/arraylast/myarray[-1]');
                expect(lastItem).to.be(3);
            });
            it('should replace the last item when using -1', function () {
                db.push('/arraylast/a1', [1, 2, 3], true);
                db.push('/arraylast/a1[-1]', 5);
                var lastItem = db.getData('/arraylast/a1[-1]');
                expect(lastItem).to.be(5);
            });
            it('should delete the last item when using -1', function () {
                db.push('/arraylast/a2', [1, 2, 3], true);
                db.delete('/arraylast/a2[-1]');
                var lastItem = db.getData('/arraylast/a2[-1]');
                expect(lastItem).to.be(2);
            });
        });

    });
    
    describe('Delete Info', function(){
        var db = new JsonDB(testFile6, true);

        it('should delete the data and save the file if saveOnPush is set', function (done) {
            var object = {test: {readable: "test"}};
            db.push("/", object);
            fs.readFile(testFile6 + ".json", "utf8", function (err, data) {
                if (err) {
                    done(err);
                    return;
                }
                expect(data).to.be(JSON.stringify(object));
                db.delete('/test');
                fs.readFile(testFile6 + ".json", "utf8", function (err, data) {
                    if (err) {
                        done(err);
                        return;
                    }
                    expect(data).to.be(JSON.stringify({}));
                    done();
                });
            });


        });
    });

    describe('Cleanup', function () {
        it('should remove the test files', function () {
            fs.unlinkSync(testFile1 + ".json");
            fs.unlinkSync(testFile2 + ".json");
            fs.unlinkSync(testFile3 + ".json");
            fs.unlinkSync(testFile4 + ".json");
            fs.unlinkSync(testFile5 + ".json");
            fs.unlinkSync(testFile6 + ".json");
            fs.rmdirSync("test/dirCreation");
        });
    });

});