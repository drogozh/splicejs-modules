define([
	'require',
	'../inheritance',
	'../component',
	{
		ListBox: 'listbox',
		DropDown: 'dropdown'
	},
	'listbox',
	'!picklist.css',
	'!picklist.html'
],function(require, inheritance, component, controls){
    "use strict";
	var scope = {
		ListBox: controls.ListBox,
		DropDown: controls.DropDown
	};

	var factory = component.ComponentFactory(require,scope);

	var PickList = inheritance.Class(function PickList(){
	}).extend(component.ComponentBase);

	PickList.prototype.onInit = function(){
	};

	PickList.prototype.onLoaded = function(){
		var _this = this;
		this.components.dropDown.onInitialDrop.subscribe(function(item){
			_this.dropDownItem = item;
			if(_this._data != null) {
				item.dataIn(_this._data);
			}
		});
	};

	PickList.prototype.dataIn = function(data){
		this._data = data;
	};

	return factory.define('PickList:picklist.html', PickList);
});