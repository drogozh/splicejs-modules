define([
    'require',
    '../inheritance',
    '../component',
    '../events',
    '../view',
    '../dataitem',
    'themeprovider',
    '!textfield.css',
    '!textfield.html'
],function(require,inheritance,component,events,dom,data,styleProvider){
    "use strict"
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var DataItem = data.DataItem;

    var TextField = inheritance.Class(function TextField(args){
        this.onDataOut = new events.MulticastEvent();
        this.onChange = new events.UnicastEvent();
        this.onEnterKey = new events.UnicastEvent();        
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

    TextField.prototype.getContent = function(){
        return this._data;
    };

    TextField.prototype.getValue = function(){
        if(this._data instanceof DataItem){
            return this._data.getStagedValue();
        }
        return this._data;
    };

    TextField.prototype.applyContent = function(content){
        if(content == undefined) return;
        if(content == null){
            this.clear();
            return;
        }

        if(typeof(content) != 'string' && !(content instanceof DataItem)){
            throw 'Invalid content, expecting string or DataItem';
        }

        this._data = content;

        if(this._data instanceof DataItem){
            var v = this._data.getStagedValue();
            if(v == null || v == 0) v = '';
            this._value = v.toString();
        } else {
            this._value = this._data;
        }

        var formattedValue = _applyFormat.call(this, this._value);

        this.elements.root.htmlElement.value = formattedValue;
        this.elements.root.attr({value:formattedValue});
    };

    TextField.prototype.clear = function(){
        this.getElement('root').node.value = '';
        this._value = '';
        this._data = null;
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
            var candidate = _getCandidateValue.call(_this, {value:this.value, position:this.selectionStart});
            if(_this._value == candidate.value) return false;            
            _valueChanged.call(_this,candidate);
            return false;
        };

        node.onmousedown = function(){
            if(_this._format == null) return true;
            this.focus();
            return false;
        };

        node.onfocus = function(e){
            if(_this._format == null) return true;
            this.setSelectionRange(this.value.length,this.value.length);
            return false;
        };

        node.onkeydown = function(e){
            if(!e) e = window.event;
            if(e.ctrlKey == true) return true;
            var isControlKey = _isControlKey(e.key);
            
            if(isControlKey == 'enter') {
                _this.onEnterKey.raise(_this._value);
                return true;
            }

            // ignore arrow keys if formatter is set
            if((isControlKey == 'left' || isControlKey == 'right') && _this._format != null){
                return false;
            }

            if(isControlKey) return true;

            var candidate = _getCandidateValue.call(_this, _forKey.call(_this,this, _this._value,e.key));
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

    function _forKey(node, value, key){
        var selectionStart = node.selectionStart;
        var selectionEnd = node.selectionEnd;
        if(this._format != null){
            selectionStart = selectionEnd = this._value.length;
        }

        var _pre = value.substring(0,selectionStart);
        var _post = value.substr(selectionEnd);
        
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
        return {value:result,position:_pre.length};
    }

    function _valueChanged(candidate){
        this._value = candidate.value;
        if(this._data instanceof DataItem) {
            this._data.setValue(this._value);
        } else {
            this._data = this._value;
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
        this.onChange(this._data);
    }

    function _applyFormat(value){
        if(typeof(this._format) == 'function' ){
            return this._format(value);
        } 
        return value;
    }

    function _isControlKey(key){
        var _key = key.toLowerCase();
        switch(_key){
            case 'right':
            case 'arrowright':
                return 'right';
            case 'left':
            case 'arrowleft':
                return 'left';
            case 'arrowup':
            case 'up':
                return 'up';
            case 'arrowdown':
            case 'down':
                return 'down';
            case 'shift':
            case 'enter':
            case 'control':
            case 'alt':
            case 'escape':
            case 'esc':
            case 'tab':
            case 'capslock':
            case 'insert':
            case 'end':
            case 'home':
            case 'pageup':
            case 'pagedown':
            case 'numlock':
            case 'pause':
            case 'scrolllock':
            case 'meta':
            case 'contextmenu':
            case 'f1':
            case 'f2':
            case 'f3':
            case 'f4':
            case 'f5':
            case 'f6':
            case 'f7':
            case 'f8':
            case 'f9':
            case 'f10':
            case 'f11':
            case 'f12':
            case 'dead':    
            return _key;
        }
        return false;
    }

    return TextField;

});