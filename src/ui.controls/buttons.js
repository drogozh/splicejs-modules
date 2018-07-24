/* global sjs */
define([
	
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
    '../dataitem',
    'themeprovider',
    'preload|../loader.css',
    'preload|../loader.template',
    '!buttons.css',
    '!buttons.html'

],function(require,inheritance,component,event,dom,data,styleProvider){


var Class = inheritance.Class
,   ComponentBase = component.ComponentBase
,   DataItem = data.DataItem;

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
var Button = Class(function Button(parent,args){
    if(args)
        this.caption = args.content != null ? args.content  : 'button';
}).extend(component.ComponentBase);

Button.prototype.onInit = function(){
    event.attach(this,{
        onClick:event.MulticastEvent
    });
}

Button.prototype.onLoaded = function(){
    var args = this.args;
    //set caption if available
    if(this.caption != null) { 
        this.setCaption(this.caption);    
    }

    event.attach(this.elements.root,{
        onmousedown: dom.DomMulticastStopEvent
    }).onmousedown.subscribe(function(){
        this.onClick(this);
    },this);
}

Button.prototype.setCaption = function(caption){
    this.caption = caption
    this.set(caption); 
}

Button.prototype.show = function(isShow){
    if(isShow === true) {
        this.elements.root.show();
    } else {
        this.elements.root.hide();
    }
}


//load new style sheet for button
styleProvider.onStyle.subscribe(function(name){
    require(['!buttons/theme/'+name+'.css'],function(b){
        styleProvider.applyStyle(b.fileName);
    });
});


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
    event.attach(this.elements.root,{
        onmousedown:dom.DomMulticastStopEvent
    }).onmousedown.subscribe((function(){
        this.isChecked = !this.isChecked;
        this.check();
        this.onChanged(this.isChecked);        
    }).bind(this));

    // this.content.default.onclick = (function(e){
    //     if(!e) e = window.event;
    //     view.cancelEventBubble(e);
    //     this.isChecked = !this.isChecked;
    //     this.check();
    //     this.onChanged(this.isChecked);
    // }).bind(this);
};

CheckBox.prototype.check = function(){
    //set class to reflect the state
    if(this.isChecked == true){
        this.elements.root.appendClass('checked');
    } else {
        this.elements.root.removeClass('checked');
    }
    this.onChanged(this);
}

/**
 * 
 */
var RadioButton = Class(function RadioButton(args){
    event.attach(this,{
        onDataOut:event.MulticastEvent
    });
}).extend(component.ComponentBase);

RadioButton.prototype.onInit = function(args){
    this._groupName = args.groupName;
};

RadioButton.prototype.onLoaded = function(){
    if(this._groupName == null) return;
    this.elements.root.node.setAttribute('name',this._groupName);
};

RadioButton.Component = factory.define("RadioButton:buttons.html",RadioButton);

/**
 * 
 */
var TextField = Class(function TextFieldController(args){
    event.attach(this,{
        onDataOut:event.MulticastEvent
    });
}).extend(component.ComponentBase);


function _textFieldOnKey(args){
    var newValue = this.getElement('root').node.value;
    this._data.setValue(newValue);
    this.onDataOut(newValue);
};

TextField.prototype.onInit = function(args){
    this.trapMouseInput = args.captureMouse;
    this.isRealtime  = args.isRealtime;
    this.isEmail = args.isEmail;
}

TextField.prototype.onLoaded = function(args){

    var changeEvents = event.attach(this.getElement('root'), {
		onkeyup		: dom.DomMulticastStopEvent,
		onchange 	: dom.DomMulticastStopEvent
	});

	if(this.trapMouseInput === true){
		event.attach(this.getElement('root'), {
			onmousedown : dom.DomMulticastStopEvent,
			onclick : dom.DomMulticastStopEvent
		});
	}

	// if(this.isRealtime == true){
	// 	changeEvents.onkeyup.subscribe(_textFieldOnKey, this);
	// }
	// else {
	// 	changeEvents.onchange.subscribe(_textFieldOnKey, this);
    // }
    
    if(this.isEmail === true) {
        this.elements.root.node.setAttribute('type','email');
        this.elements.root.node.setAttribute('autocorrect','off');
        this.elements.root.node.setAttribute('autocapitalize','none');
    }
}

TextField.prototype.dataIn = function(item){
    if(!item) return;
    if(item instanceof DataItem) {
        this._data = item;
    } else {    
        this._data = new DataItem(item);
    }
    var value = this._data.getValue();

    this.elements.root.htmlElement.value = value;
	this.elements.root.attr({value:value});
};

TextField.prototype.applyContent = function(content){
    this.dataIn(content);
};

TextField.prototype.dataOut = function(){
    this.elements.root.attr({
        value:this.elements.root.htmlElement.value
    });
    return this.elements.root.attrGet('value');
}

TextField.prototype.getValue = function(){
    return this.elements.root.node.value;
}

TextField.prototype.onDataIn = function(item){
	if(!item) return;
	this.elements.root.attr({value:item.getValue()});
};

TextField.prototype.clear = function(){
    this.getElement('root').node.value = '';
    this._data = new DataItem();
};

TextField.prototype.focus = function(){
	this.getElement('root').node.focus();
};

TextField.prototype.blur = function(){
    this.getElement('root').node.blur();
};


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
    Button		: factory.define('Button:buttons.html',Button,{animated:true}),
    RadioButton : RadioButton,
    Label		: factory.define('Label:buttons.html',Label),
    CheckBox	: factory.define('CheckBox:buttons.html',CheckBox),
    TextField   : factory.define('TextField:buttons.html',TextField)
}

//module end
});
