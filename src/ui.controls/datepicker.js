define([
	'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
	'../dataitem',
	{
		Calendar:'calendar',
		DropDown:'dropdown'
	},
	'!datepicker.html'
],function(require,inheritance,component,event,view,dataApi,controls){
	"use strict";

	var scope = {
		Calendar:controls.Calendar,
		DropDown:controls.DropDown
	};

	var factory = component.ComponentFactory(require,scope);
	var DataItem = dataApi.DataItem;

	var DatePicker = inheritance.Class(function DatePicker(args){
		event.attach(this,{
			onDateSelected : event.MulticastEvent
		});
		var _d = new Date();
		this.date = new Date(_d.getFullYear(), _d.getMonth(), _d.getDate());
	}).extend(component.ComponentBase);

	DatePicker.Component = factory.define('DatePicker:datepicker.html',DatePicker);

	DatePicker.prototype.onInit = function(args){
		this._formater = args.format != null ? this.getFormatter(args.format) : function(date){return date.toString();};
	};

	DatePicker.prototype.onDataIn = function(item){
		this.setDate(item.getValue());
	};

	DatePicker.prototype.receiveFromCalendar = function (date) {
	    this.setDate(date);
		this.getComponent('selector').close();
		this.onDateSelected(date);
	};

    DatePicker.prototype.onLoaded = function(){
        this.setDate(this.date);
    };

    //sets dates and will not trigger events
	DatePicker.prototype.setDate = function (date) {
	    if (!date) return;
        this.date = date;
		this.components.selector.set(this._formater(date));
		if(this._data != null) {
			this._data.setValue(date);
		}
	};

	DatePicker.prototype.enable = function(isEnabled){
		this.components.selector.enable(isEnabled);
	};

	DatePicker.prototype.applyContent = function(content){
		var value = content;
		if(content instanceof DataItem){
			this._data = content;
			value = content.getValue();
		}
		if(value instanceof Date){
			this.setDate(value);
		} else if(this._data != null){
			this._data.setValue(this.date);
		}
	};

	return DatePicker;
});
