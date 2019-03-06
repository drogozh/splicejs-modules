define([
	'require',
	'../inheritance',
	'../component',
	'../event',
	{
		PickList: 'picklist'
	},
	'../dataitem',
	'!boolean.picker.html'
],function(require, inheritance, component, events, controls, dataApi){
    
    "use strict";
	var scope = {
		PickList: controls.PickList
	};

	var factory = component.ComponentFactory(require,scope);

	var BooleanPicker = inheritance.Class(function BooleanPicker(){
		events.attach(this,{
			onItemSelected:events.UnicastEvent
		});
	}).extend(component.ComponentBase);

    BooleanPicker.Component = factory.define('BooleanPicker:boolean.picker.html', BooleanPicker);

    BooleanPicker.prototype.onLoaded = function(){
        this.getComponent('pickList').dataIn(['True','False']);
    };

    BooleanPicker.prototype.applyContent = function(content){
        this.getComponent('pickList').applyContent(content);
    };

    return BooleanPicker;
});
    