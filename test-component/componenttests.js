define([
    'require',
    'splicejs.modules/inheritance',
    'splicejs.modules/component',
    {
        PickList : 'splicejs.modules/ui.controls/picklist'
    },
    '!componenttests.html',
    'preload|splicejs.modules/loader.css',
    'preload|splicejs.modules/loader.template'
],function(require, inheritance, component, controls){

    var scope = {
        PickList: controls.PickList
    };

    var factory = component.ComponentFactory(require, scope);

    var ComponentTests = 
        scope.ComponentTests = inheritance.Class(function ComponentTests() {
    }).extend(component.ComponentBase);

    return factory.define('ComponentTests:componenttests.html',ComponentTests);

});