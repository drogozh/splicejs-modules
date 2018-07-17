define([
    'splicejs.modules/collection'
],function(collection){
    var assert = require('assert');
    
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
                for(var i = 0; i < numbers.length; i++ ){
                    if(numbers[i] !== i) {
                        assert.fail();
                    }
                }            
            });

        });

        describe('collection(10).where(x => x > 7).toArray()', function(){
            it('returns array of two elements, 8 and 9', function(){
                var numbers = collection(10).where(x=>x > 7).toArray();
                if(numbers.length != 2) assert.fail();
                if(numbers[0] != 8) assert.fail();
                if(numbers[1] != 9) assert.fail();
            });
        });

    });

    

    run();

});
