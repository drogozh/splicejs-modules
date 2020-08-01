require('splicejs-loader/splice.loader');

var assert = require('assert');

describe('Collection test bootstrap', function() {
    it('Ok', function() {
        assert.equal(1,1);
    });
});

define([
    '../lib/collections'
],function(collections){
    var collection = collections.collection;

    describe('Sequential Collection', function() {
        describe('collection(10).toArray()', function() {
            it('should return an Array of 10 elements', function() {
                var numbers = collection(10).toArray();            
                if(!(numbers instanceof Array)) {
                    assert.fail();
                }
            });

            it('returned array should contain sequential elements from 0 to 9', function() {
                var numbers = collection(10).toArray();
                for(var i = 0; i < numbers.length; i++ ) {
                    if(numbers[i] !== i) {
                        assert.fail();
                    }
                }            
            });
        });

        describe('collection(10).where(x => x > 7).toArray()', function() {
            it('returns array of two elements, 8 and 9', function() {
                var numbers = collection(10).where(x => x > 7).toArray();
                if(numbers.length != 2) assert.fail();
                if(numbers[0] != 8) assert.fail();
                if(numbers[1] != 9) assert.fail();
            });
        });

    });
});
