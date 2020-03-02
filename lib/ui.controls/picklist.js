define([
	'require',
	'../inheritance',
	'../component',
	'../event',
	{
		ListBox: 'listbox',
		DropDown: 'dropdown'
	},
	'../dataitem',
	'!picklist.css',
	'!picklist.html'
],function(require, inheritance, component, events, controls, dataApi){
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
				try {
					_this.setSelectedItem(item);
				} finally {
					_this.components.dropDown.close();
				}
			});
			item.getDisplayParent().reflow();
		});
	};

	PickList.prototype.applyContent = function(content){
		if(content instanceof dataApi.DataItem){
			this._boundData = content;
		}
		_applySelectedValue.call(this, _getValue(content));
	};

	/**
	 * Applies supplied object as selector content
	 * Content is not validated against the list items
	 * @param {any} item 
	 */
	PickList.prototype.setSelectedItem = function(item){
		var value = this._selectedItem = _getValue(item);
		if(this._boundData != null){
			this._boundData.setValue(value);
		}
		_applySelectedValue.call(this, value);
		this.onItemSelected(item);
	};

	function _applySelectedValue(value){
		if(value != null) { 		
			this.components.dropDown.applyContent(value);
		} else {
			this.components.dropDown.applyContent(this.selectorDefaultValue);
		}
	}

	function _getValue(item){
		var value = null;
		if(item instanceof dataApi.DataItem) {
			value = item.getValue();
		} else {
			value = item;
		}
		return value;
	}

	PickList.prototype.clearSelectedItem = function(){
		this.components.dropDown.clear();
		this._selectedItem = null;
	};

	PickList.prototype.clear = function(){
		this.dataIn([]);
		this.clearSelectedItem();
	};

	PickList.prototype.getSelectedItem = function(){
		if(this._selectedItem instanceof dataApi.DataItem) {
			return this._selectedItem.getValue();
		}
		return this._selectedItem;
	};

	PickList.prototype.dataIn = function(data){
		this._data = data;
		if(this.listBox != null) {
			this.listBox.dataIn(this._data);
		}
	};

	PickList.prototype.enable = function(isEnabled){
		this.components.dropDown.enable(isEnabled);
	};

	PickList.prototype.focus = function(){
		this.node.focus();
	};

	return factory.define('PickList:picklist.html', PickList);
});