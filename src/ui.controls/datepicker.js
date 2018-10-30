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

	var	Class       = inheritance.Class
	,	format      = text.format;

	var factory = component.ComponentFactory(require,scope);

	var DatePicker = Class(function DatePicker(args){
		event.attach(this,{
			onDateSelected : event.MulticastEvent
		});

		this.date = new Date();

		if(args && args.format){
			this.format = args.format;
		}

	}).extend(component.ComponentBase);

	DatePicker.Component = factory.define('DatePicker:datepicker.html',DatePicker);

	DatePicker.prototype.onInit = function(){

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
		if (this.format) {
	    	date = format('{0:' + this.format + '}', date);
	    } else {
			date = date.toString();
		}
		
		this.components.selector.set(date);
	};


	return DatePicker;

});
