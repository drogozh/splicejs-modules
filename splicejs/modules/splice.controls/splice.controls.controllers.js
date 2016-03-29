/* global _*/
sjs.module({
type:'component'
,
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Component: '/{sjshome}/modules/splice.component.core.js'},
	{ Event: '/{sjshome}/modules/splice.event.js'},
	{'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
	 'splice.controls.controllers.html'
]}
,
function(scope){
    "use strict";
	var 
        sjs = scope.sjs
    ,   imports = scope.imports
    ;

	var Class = imports.Inheritance.Class
	,	Controller = imports.Component.Controller
	,   UIControl = imports.SpliceJS.UI.UIControl
	,	event = imports.Event.event
	;

	var DomIterator = Class(function DomIteratorController(args){
		this.base();
		this.elements = [];

		event(this).attach({
			onStyleSelect : event.multicast
		});

	}).extend(UIControl);

	DomIterator.prototype.initialize = function(){
	};

	DomIterator.prototype.dataItemChanged = function(item){
		var i = item.fullPath().split('.')[0];
		var di = null;

		//cleanup deleted elements
		if(item.isDeleted == true){
			this.content(this.elements[i]).remove();
			return;
		}

		if(this.dataItemPath) {
			di = this.dataItem.path(i+'.'+this.dataItemPath);
		}
		else {
			di = this.dataItem.path(i);
		}

		if(this.elements[i]){
			this.elements[i].content(di.getValue()).replace();
			this.elements[i].dataIn(di);
		} else {
			var element = new this.element({parent:this});
			element.content(di.getValue()).replace();
			this.content(element).add();
			element.dataIn(di);

			//cache elements
			this.elements.push(element);


		}

	};

	DomIterator.prototype.onDataIn = function(dataItem){
		if(this.element == null) return;

		dataItem.subscribe(this.dataItemChanged, this);

		var source = dataItem.getValue();
		if(!(source instanceof Array)) return;

		//update existing elements
		for(var i=0; i < this.elements.length; i++){
			var element = this.elements[i];
			element.content(source[i]).replace();
			element.dataIn(dataItem.path(i));
		}

		//create new elements
		for(var i = this.elements.length; i < source.length; i++){
			var element = new this.element({parent:this});
			element.content(source[i]).replace();
			this.content(element).add();
			element.dataIn(dataItem.path(i));

			//cache elements
			this.elements.push(element);
		}
	};


	//scope exports
	scope.add(
		DomIterator
	);

	//module exports
	scope.exports(
		DomIterator
	);

}
) //module declaration end
