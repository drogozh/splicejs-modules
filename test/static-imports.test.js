var assert = require('assert');

describe('Test bootstrap', function() {
    it('Should initialize test framework', function() {
        assert.equal(1,1);
    });
});

require('../src/splice.loader.js');

define(function(){
    describe('Define with a single function argument', function() {
        it('Should execute the callback', function() {
            assert.equal(1,1);
        });
    }); 
});

define([
    'loader'
],function(loader){
    describe('Single "loader" import', function() {
        it('Should import loader reference', function() {
            assert.equal(1,1);
        });
    });
});

define([
    'require'
],function(req){
    describe('Single "require" import', function() {
        it('Should import require reference', function() {
            assert.notEqual(req,null);
        });
    });
});

define([
    'require',
    'loader'
],function(req,loader){
    describe('Require and Loader import', function() {
        it('Should import require and loader reference', function() {
            assert.notEqual(req,null);
            assert.notEqual(loader,null);
        });
    });
});

define([
    'require',
    'loader',
    'exports'
],function(req,loader,exports){
    describe('Require and Loader import', function() {
        it('Should import require, loader and exports reference', function() {
            assert.notEqual(req,null);
            assert.notEqual(loader,null);
            assert.notEqual(loader,null);
        });
    });
});
