define([
	'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
	'../text',
	{
		Calendar:'calendar',
		DropDown:'dropdown'
	},
	'!datepicker.html'
],function(require,inheritance,component,event,view,text,controls){
	"use strict";

	var scope = {
		Calendar:controls.Calendar,
		DropDown:controls.DropDown
	};

	var factory = component.ComponentFactory(require,scope);

	var DatePicker = inheritance.Class(function DatePicker(args){
		event.attach(this,{
			onDateSelected : event.MulticastEvent
		});

		this.date = new Date();
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
   		date = this._formater(date);
		this.components.selector.set(date);
	};

	DatePicker.prototype.enable = function(isEnabled){
		this.components.selector.enable(isEnabled);
	};

	return DatePicker;
});
