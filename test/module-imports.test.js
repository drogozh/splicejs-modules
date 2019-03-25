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