const expect = require("expect.js");
const Util = require("../lib/utils.js");
const ArrayInfo = require('../lib/ArrayInfo');
const DataError = require("../lib/Errors").DataError;
const SafeRegex = require('safe-regex');

describe('Utils', function () {

    describe('Array regex', function(){
       it('should be safe', function() {
           expect(SafeRegex(Util.arrayRegex())).to.be.ok();
       });
    });

    describe('Process Array', function () {
        it('should not process a not well formatted array', function () {
            expect(Util.processArray('array[[]')).to.be(null);
        });

        it('should process array with numerical key', function () {
            var arrayInfo = Util.processArray('array[0]');
            expect(arrayInfo).to.be.a(ArrayInfo);
            expect(arrayInfo.property).to.be('array');
            expect(arrayInfo.append).to.not.be.ok();
            expect(arrayInfo.index).to.be(0);
        });

        it('should process array append', function () {
            var arrayInfo = Util.processArray('array[]');
            expect(arrayInfo).to.be.a(ArrayInfo);
            expect(arrayInfo.property).to.be('array');
            expect(arrayInfo.append).to.be.ok();
            expect(arrayInfo.index).to.be('');
        });

        it('should process array -1', function () {
            var arrayInfo = Util.processArray('array[-1]');
            expect(arrayInfo).to.be.a(ArrayInfo);
            expect(arrayInfo.property).to.be('array');
            expect(arrayInfo.append).to.not.be.ok();
            expect(arrayInfo.index).to.be(-1);
        });

        it('should use the cache', function () {
            var arrayInfo = Util.processArray('info[0]');

            expect(arrayInfo).to.be.a(ArrayInfo);
            expect(arrayInfo.property).to.be('info');
            expect(arrayInfo.append).to.not.be.ok();
            expect(arrayInfo.index).to.be(0);

            var arrayInfoSame = Util.processArray('info[0]');

            expect(arrayInfo).to.be(arrayInfoSame);

        });

        it('should not process array with string key', function () {
            expect(function (args) {
                Util.processArray(args);
            }).withArgs("myarray[test]").to.throwException(function (e) {
                expect(e).to.be.a(DataError);
                expect(e.id).to.be(200);
            });
        });

        it('should ignore an empty agument', function () {
            var arrayInfo = Util.processArray(undefined);
            expect(arrayInfo).to.be(null);
        });

    });

});