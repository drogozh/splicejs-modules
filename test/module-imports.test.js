var assert = require('assert');

describe('Test bootstrap', function() {
    it('Should initialize test framework', function() {
        assert.equal(1,1);
    });
});

require('../src/splice.loader.js');

define([
    'modules/module-a'
],function(a){
    describe('Define with a single function argument', function() {
        it('Should execute the callback', function() {
            assert.equal(a.result(),true);
        });
    }); 
});

define([
    'modules/with-export-dependency'
],function(a){
    describe('Loading dependency with exports argument', function() {
        it('Should resolve import and assert true', function() {
            assert.equal(a.result,true);
        });
    }); 
});