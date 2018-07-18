define([
	'require',
	'../inheritance',
	'../component',
	'../event',
	'../view',
	'../component.interaction',
    '../util',
    '../collection',
	'preload|../loader.css',
	'preload|../loader.template',
	'!listbox.css',
	'!listbox.html'
],function(require,inheritance,component,event,view,interaction,utils, collection){
	"use strict";

	var factory = component.ComponentFactory(require,{});
	
	var ListBox = inheritance.Class(function ListBox(parent,args){
	}).extend(component.ComponentBase);


	ListBox.prototype.dataIn = function(data){
		console.log(data);
	};

	return factory.define('ListBox:listbox.html', ListBox);

});
