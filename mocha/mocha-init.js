console.log('mocha init');

require('../node_modules/splicejs/src/splice.js');

define(['loader'],function(loader){
    loader.setVar('splicejs.modules','src');
});

console.log('mocha init');