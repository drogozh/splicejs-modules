define([

	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
	'preload|{splice.modules}/component.loader',

],function(require,inheritance,component,event,view){


	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase;


    var DomIterator = Class(function DomIterator(){

    }).extend(ComponentBase);



    return DomIterator;


})