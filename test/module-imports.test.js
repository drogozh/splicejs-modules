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
    'modules/module-b'
],function(a){
    describe('Define with a single function argument', function() {
        it('Should execute the callback', function() {
            assert.equal(a.result,true);
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

define([
    'modules/with-return-and-empty-exports'
],function(a){
    describe('Loading dependency with exports argument and "return" exports', function() {
        it('Empty exports argument may not override "return" exports', function() {
            assert.equal(a.result,true);
        });
    }); 
});

define([
    'modules/with-return-and-nonempty-exports'
],function(a){
    describe('Loading dependency with exports argument and "return" exports', function() {
        it('Exports argument must override "return" exports', function() {
            assert.equal(a.result,true);
        });
    }); 
});

define([
    'modules/with-default-export'
],function(a){
    describe('Loading dependency with default export', function() {
        it('Imports should be accessible directly', function() {
            assert.equal(a.default,true);
        });
    }); 
});

define([
    'modules/with-default-return'
],function(a){
    describe('Loading dependency with default export', function() {
        it('Imports should be accessible directly', function() {
            assert.equal(a.default,true);
        });
    }); 
});

