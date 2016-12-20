/* global sjs */
define([
	
	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
	'preload|{splice.modules}/component.loader',
	'!buttons.css'

],function(require,inheritance,component,event,view){


	var Class = inheritance.Class;

	//component factory
    var factory = component.ComponentFactory(require,{
        Splice:{  
            Buttons:{
                CheckBox:null
            }
        }
    });

	/** 
	 * 	Button Component
 	 */
    var Button = Class(function Button(args){
		if(args)
        	this.caption = args.caption || 'button';
	}).extend(component.ComponentBase);
	
	Button.prototype.onInit = function(){
		event.attach(this,{
            onClick:event.MulticastEvent
        });
	}

    Button.prototype.onLoaded = function(){
        var args = this.args;
        //set caption if available
        if(this.caption) { 
            this.setCaption(this.caption);    
        }

        this.content.default.onclick = (function(){
            this.onClick(this);
        }).bind(this);
    }

    Button.prototype.setCaption = function(caption){
        this.caption = caption
        this.replace(caption); 
    }    
		
	/**
	 *	Label Component 
	 */
	var Label = Class(function Label(args){
        this.args = args || {};
	}).extend(component.ComponentBase);



	/**
	 * CheckBox Component
	 */
	var CheckBox = Class(function CheckBox(args){
		if(args)
        	this.isChecked = args.isChecked || false;
	}).extend(component.ComponentBase);

	CheckBox.prototype.onInit = function(args){
        event.attach(this,{
            onChanged:event.MulticastEvent
        });
	}

	CheckBox.prototype.onLoaded = function(){

        this.check();

		this.content.default.onclick = (function(e){
			if(!e) e = window.event;
			view.cancelEventBubble(e);
			this.isChecked = !this.isChecked;
			this.check();
			this.onChanged(this.isChecked);
		}).bind(this);
	};

    CheckBox.prototype.check = function(){
        //set class to reflect the state
        if(this.isChecked == true){
            view.css.addClass(this.content.default,'checked');
        } else {
            view.css.removeClass(this.content.default,'checked');
        }
    }

	// var Button = Class(function ButtonController(args){
	// 	this.base(args);
	// 	Events.attach(this,{
	// 		onClick : MulticastEvent
	// 	});
	// }).extend(UIControl);


	// Button.prototype.initialize = function(){

	// 	Events.attach(this.views.root,{
	// 		onclick		: Views.DomMulticastStopEvent,
    // 		onmousedown	: Views.DomMulticastStopEvent
	// 	});

	// 	this.views.root.onclick.subscribe(function(){
	// 		if(this.isDisabled == true) return;
	// 		this.onClick(this.dataItem);
	// 	},this);

	// 	if(this.isDisabled) this.disable();
	// };


	// Button.prototype.setLabel = function(label){
	// 	this.elements.root.value = label;
	// };

	// Button.prototype.enable = function(){
	// 	this.elements.root.className = '-splicejs-button';
	// 	this.isDisabled = false;
	// 	this.onDomChanged();
	// };

	// Button.prototype.disable = function(){
	// 	this.elements.root.className = '-splicejs-button-disabled';
	// 	this.isDisabled = true;
	// 	this.onDomChanged();
	// };

	// Button.prototype.onDataIn = function(item){
	// 	if(!this.staticContent)
	// 	this.content(item.getValue()).replace();
    // };

	// Button.prototype.onDataItemChanged = function(){
	// 	this.content(this.dataItem.getValue()).replace();
	// };

	// var CheckBox = Class(function CheckBoxController(args){
	// 	this.base(args);
	// 	this.isChecked = false;

	// 	Events.attach(this,{
	// 		onChecked	:	MulticastEvent
	// 	});

	// }).extend(UIControl);

	// CheckBox.prototype.initialize = function(){
	// 	Events.attach(this.views.root,{
	// 		onclick 	:	Views.DomMulticastStopEvent,
    //   		onmousedown : 	Views.DomMulticastStopEvent
	// 	}).onclick.subscribe(function(){
	// 		this.isChecked = !this.isChecked;

	// 		if(this.dataItem) {
	// 			this.dataItem.setValue(this.isChecked);
	// 		}

	// 		this.check(this.isChecked);
	// 		this.onChecked(this.dataItem);
	// 	},this);
	// }

	// CheckBox.prototype.onDataIn = function(dataItem){
	// 	this.isChecked = dataItem.getValue() === true ? true : false;
	// 	this.check(this.isChecked);
	// };

	// CheckBox.prototype.check = function(isChecked){
	// 	this.isChecked = isChecked;
	// 	if(isChecked === true) {
	// 		this.views.root.cssc('checked').add();
	// 	} else {
	// 		this.views.root.cssc('checked').remove();
	// 	}
	// };

	// CheckBox.prototype.clear = function(){
	// 	this.views.root.cssc('checked').remove();
	// };



	// var RadioButton = Class(function RadioButtonController(args){
	// 	this.base(arguments);

	// 	var self = this;
	// 	this.elements.root.onclick = function(){

	// 		if(self.elements.root.checked) {
	// 			if(self.dataPath)
	// 			self.dataItem[self.dataPath] = true
	// 		} else {
	// 			if(self.dataPath)
	// 			self.dataItem[self.dataPath] = false;
	// 		}
	// 		self.dataOut(self.dataItem);
	// 	}

	// }).extend(UIControl);


	// RadioButton.prototype.dataIn = function(dataItem){
	// 	UIControl.prototype.dataIn.call(this,dataItem);

	// 	if(!this.dataPath) {
	// 		this.elements.root.checked = false;
	// 		return;
	// 	}

	// 	if(this.dataItem[this.dataPath] === true) {
	// 		this.elements.root.checked = true;
	// 	}
	// 	else {
	// 		this.elements.root.checked = false;
	// 	}
	// };


	// var TextField = Class(function TextFieldController(args){
	// 	this.base(args);
	// 	this.trapMouseInput = args.trapMouseInput;
	// }).extend(UIControl);


	// function _textFieldOnKey(args){
	// 	this.dataItem.setValue(args.source.value);
	// 	this.onDataOut(this.dataItem);
	// };

	// TextField.prototype.initialize = function(){

	// 	Events.attach(this.views.root, {
	// 		onkeyup		: Views.DomMulticastStopEvent,
	// 		onchange 	: Views.DomMulticastStopEvent
	// 	});

	// 	if(this.trapMouseInput === true){
	// 		Events.attach(this.views.root, {
	// 			onmousedown : Views.DomMulticastStopEvent,
	// 			onclick:Views.DomMulticastStopEvent
	// 		});
	// 	}

	// 	if(this.isRealtime){
	// 		this.views.root.onkeyup.subscribe(_textFieldOnKey, this);
	// 	}
	// 	else {
	// 		this.views.root.onchange.subscribe(_textFieldOnKey, this);
	// 	}
	// }


	// TextField.prototype.onDataIn = function(item){
	// 	if(!item) return;
	// 	this.views.root.attr({value:item.getValue()});
	// };

	// TextField.prototype.clear = function(){
	// 	this.elements.root.value = '';
	// };

	// TextField.prototype.focus = function(){
	// 	this.elements.root.focus();
	// };


	// /* module scope and exports */
	// scope.add(
	// 	{ButtonController 	 : Button},
	// 	{CheckBoxController  : CheckBox},
	// 	{TextFieldController : TextField}
	// );

	// scope.exports(
	// 	{ButtonController 	 : Button},
	// 	{CheckBoxController  : CheckBox},
	// 	{TextFieldController : TextField}
	// );

	return {
		Button		: factory.define('Button:buttons.html',Button),
		Label		: factory.define('Label:buttons.html',Label),
		CheckBox	: factory.define('CheckBox:buttons.html',CheckBox)
	}
});
