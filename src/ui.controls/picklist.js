define([
	'require',
	'../inheritance',
	'../component',
	'../event',
	{
		ListBox: 'listbox',
		DropDown: 'dropdown'
	},
	'!picklist.css',
	'!picklist.html'
],function(require, inheritance, component, events, controls){
    "use strict";
	var scope = {
		ListBox: controls.ListBox,
		DropDown: controls.DropDown
	};

	var factory = component.ComponentFactory(require,scope);

	var PickList = inheritance.Class(function PickList(){
		events.attach(this,{
			onItemSelected:events.UnicastEvent
		});
	}).extend(component.ComponentBase);

	PickList.prototype.onInit = function(args){
		this.itemTemplate = args.itemTemplate;
		this.selectorItemTemplate = args.selectorItemTemplate;
		this.selectorDefaultValue = args.selectorDefaultValue;
	};

	PickList.prototype.onLoaded = function(){
		var _this = this;
		this.components.dropDown.onInitialDrop.subscribe(function(item){
			_this.listBox = item;
			if(_this._data != null) {
				item.dataIn(_this._data);
			}
			_this.listBox.onItemSelected.subscribe(function(item){
				_this.components.dropDown.applyContent(item);
				_this.onItemSelected(item);
				_this._selectedItem = item;
			});
		});
	};

	/**
	 * Applies supplied object as selector content
	 * Content is not validated against the list items
	 * @param {any} item 
	 */
	PickList.prototype.setSelectedItem = function(item){
		this.components.dropDown.applyContent(item);
		this._selectedItem = item;
	};

	PickList.prototype.getSelectedItem = function(){
		return this._selectedItem;
	};

	PickList.prototype.dataIn = function(data){
		this._data = data;
		if(this.listBox != null) {
			this.listBox.dataIn(this._data);
		}
	};

	return factory.define('PickList:picklist.html', PickList);
});