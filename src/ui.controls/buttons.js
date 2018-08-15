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


    return {
        Button		: factory.define('Button:buttons.html',Button,{animated:true}),
        RadioButton : RadioButton,
        Label		: factory.define('Label:buttons.html',Label)
    }
});
