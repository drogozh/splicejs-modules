require('loader')
    .setVar('splicejs.modules','../src');
    

define([
    'componenttests'
], function(app){
    var instance = new app();
    instance.display();
});
