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
    '!textfield.css',
    '!textfield.html'
],function(require,inheritance,component,event,dom,data,styleProvider){
    "use strict"
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var DataItem = data.DataItem;

    var TextField = inheritance.Class(function TextField(args){
        event.attach(this,{
            onDataOut:event.MulticastEvent,
            onEnterKey:event.UnicastEvent
        });
    }).extend(component.ComponentBase);

    TextField.Component = factory.define('TextField:textfield.html',TextField);

    TextField.prototype.onInit = function(args){
        this.trapMouseInput = args.captureMouse;
        this.isRealtime  = args.isRealtime;
        this.isEmail = args.isEmail;
        this.isPassword = args.isPassword;
        this.placeholder = args.placeholder;
        this._format = args.format;
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

        changeEvents.onkeyup.subscribe(_textFieldOnKey, this);
        
        if(this.isEmail === true) {
            this.elements.root.node.setAttribute('type','email');
            this.elements.root.node.setAttribute('autocorrect','off');
            this.elements.root.node.setAttribute('autocapitalize','none');
        }

        if(this.isPassword == true) {
            this.elements.root.node.type = 'password';
        }

        if(this.placeholder != null) {
            this.elements.root.node.setAttribute('placeholder',this.placeholder);
        }

        this._format = this.getFormatter(this._format);
    };

    TextField.prototype.applyContent = function(content){
        if(content == null){
            this.clear();
        }

        if(!(content instanceof DataItem)){
           content = new DataItem(content);
        }

        this._data = content;
        var value = this._data.getValue();

        var formattedValue = _applyFormat.call(this,value);

        this.elements.root.htmlElement.value = formattedValue;
        this.elements.root.attr({value:formattedValue});
    };

    TextField.prototype.getValue = function(){
        return this.elements.root.node.value;
    };

    TextField.prototype.clear = function(){
        this.getElement('root').node.value = '';
        this._data = new DataItem();
    };

    TextField.prototype.focus = function(){
        this.getElement('root').node.focus();
    };

    TextField.prototype.select = function(){
        this.getElement('root').node.select();
    };

    TextField.prototype.blur = function(){
        this.getElement('root').node.blur();
    };

    TextField.prototype.enable = function(isEnabled){
        if(isEnabled === true) {
            this.getElement('root').attr({disabled:null});
            this.getElement('root').removeClass('disabled');
        } else {
            this.getElement('root').attr({disabled:true});
            this.getElement('root').addClass('disabled');
        }
    };

    function _applyFormat(value){
        if(typeof(this._format) == 'function' ){
            return this._format(value);
        } 
        return value;
    }

    function _textFieldOnKey(args){
        var newValue = this.getElement('root').node.value;
        if(this._data != null) {
            this._data.setValue(newValue);
        }

        if(this.isRealtime) {
            this.onDataOut(newValue);
        }
        // enter key
        if(args.domEvent.keyCode == 13) {
            this.onEnterKey(newValue);
        }
    };

    function _isControlCharacter(key){
        switch(key.toLower()){
            case 'backspace':
            case 'escape':
            case 'esc':
            case 'right':
            case 'arrowright':
            case 'left':
            case 'arrowleft':
            case 'left':
            case 'arrowup':
            case 'up':
            case 'arrowdown':
            case 'down':
            return true;
        }
        return false;
    }

    return TextField;

});