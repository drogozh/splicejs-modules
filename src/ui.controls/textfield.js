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
        this.enabled = args.enabled;
        this._format = args.format;
        if(args.filter != null && typeof(args.filter) == 'string'){
            this._filter = new RegExp(args.filter);
        }
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
        
        this.elements.root.node.setAttribute('spellcheck','false');

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

        if(this.enabled === false){
            this.enable(this.enabled);
        }

        this._format = this.getFormatter(this._format);

        _attachHandlers.call(this);
    };

    TextField.prototype.applyContent = function(content){
        if(content == null){
            this.clear();
        }

        if(!(content instanceof DataItem)){
           content = new DataItem(content);
        }

        this._data = content;
        var value = this._value = this._data.getStringValue();

        var formattedValue = _applyFormat.call(this,value);

        this.elements.root.htmlElement.value = formattedValue;
        this.elements.root.attr({value:formattedValue});
    };

    TextField.prototype.getValue = function(){
        return this.elements.root.node.value;
    };

    TextField.prototype.clear = function(){
        this.getElement('root').node.value = '';
        this._value = '';
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

    function _attachHandlers(){
        this._value = '';
        var _this = this;
        var node = this.elements.root.node;

        node.oninput = function(e){
            if(!e) e = window.event;
        
            console.log("input", e);
            console.log("value", this.value);
            this.value = _this._value;
            return false;
        };

        node.onfocus = function(){
            if(_this._format == null) return;
            this.setSelectionRange(this.value.length,this.value.length);
            return false;
        };

        node.onkeydown = function(e){
            if(!e) e = window.event;
            console.log("key",e);
            if(e.ctrlKey == true) return true;
            var isControlKey = _isControlKey(e.key);
            
            if(isControlKey == 'enter') {
                _this.onEnterKey(_this._value);
                return true;
            }

            if(isControlKey) return true;

            var candidate = _getCandidateValue.call(_this, _forKey.call(node, _this._value,e.key));
            if(_this._value == candidate.value) return false;            
            _valueChanged.call(_this,candidate);
            return false;
        };
    }

    function _getCandidateValue(temp){
        if(temp.value == '') return temp;
        if(this._filter != null){
            if(this._filter.test(temp.value)){
                return temp;
            }
            return {value:this._value}; 
        }
        return temp;
    }

    function _forKey(value, key){
        var _pre = value.substring(0,this.selectionStart);
        var _post = value.substr(this.selectionEnd);
        
        var _key = key.toLowerCase();
        switch(_key){
            case 'backspace':
                _pre = _pre.substr(0,_pre.length-1);
            break;
            case 'delete':
                _post = _post.substring(1);
            break;
            default:
            _pre = _pre + key;
            break;
        }

        var result = _pre + _post;
        console.log(result);
        return {value:result,position:_pre.length};
    }

    function _valueChanged(candidate){
        this._value = candidate.value;
        if(this._data != null) {
            this._data.setValue(this._value);
        }

        if(this._format != null) {
            this.elements.root.node.value = this._format(this._value);
            this.elements.root.node.setSelectionRange(
                this.elements.root.node.value.length,
                this.elements.root.node.value.length);
        } else {
            this.elements.root.node.value = this._value;
            this.elements.root.node.setSelectionRange(candidate.position,candidate.position);
        }
    }

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
    }

    function _isControlKey(key){
        var _key = key.toLowerCase();
        switch(_key){
            case 'shift':
            case 'enter':
            case 'control':
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
            case 'tab':
            return _key;
        }
        return false;
    }

    return TextField;

});