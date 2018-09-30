define([
	'require',
	'../inheritance',
	'../component',
	'../event',
	'../view',
	'../interaction',
    '../util',
    '../collections',
	'preload|../loader.css',
	'preload|../loader.template',
	'!listbox.css',
	'!listbox.html'
],function(require,inheritance,component,event,element,interaction,utils, collections){
	"use strict";

	var factory = component.ComponentFactory(require,{});
	
	var collection = collections.collection;

	var ListBoxItem = inheritance.Class(function ListBoxItem(parent,args){
	}).extend(component.ComponentBase);

	ListBoxItem.Component = factory.define("ListBoxItem:listbox.html",ListBoxItem);



	var ListBox = inheritance.Class(function ListBox(parent,args){
	}).extend(component.ComponentBase);

	ListBox.prototype.onInit = function(args){
		event.attach(this,{
			onItemSelected: event.UnicastEvent
		});

		this.itemTemplate = args.itemTemplate;
	};

	ListBox.prototype.onLoaded = function(){
		var _this = this;
		this._docFragment = document.createDocumentFragment();
		event.attach(this.elements.root.node, {
			onmousedown: element.DomUnicastEvent
		}).onmousedown.subscribe(function(e){
			var itemVm = component.locate.visual(e.source,ListBoxItem);
			if(itemVm == null) return;

			var item = _this._data.forIndex(itemVm.elements.root.node.__sjs_idx);
			if(item == null) return;
			_this.onItemSelected(item);
		});
	};

	ListBox.prototype.dataIn = function(data){
		this.elements.root.node.innerHTML = '';
		
		this._data = collection(data);
		if(!data) return;
		var _this = this;
		var fragment = document.createDocumentFragment();

		var createItem = function(item){
			return item;
		};

		if(this.itemTemplate != null) {
			createItem = function(item){
				return new _this.itemTemplate(_this).applyContent(item);
			};
		}
		
		this._data.forEach(function(item,key){
			var li = new ListBoxItem.Component(_this);
			li.elements.root.node.__sjs_idx = key;
			li.applyContent(createItem(item));
			fragment.appendChild(li.elements.root.node);
		});
		
		_this.elements.root.node.appendChild(fragment);
	};

	return factory.define('ListBox:listbox.html', ListBox);

});
