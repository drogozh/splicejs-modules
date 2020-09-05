define([
    'require',
    '../inheritance',
    '../component',
    '../events',
    '../view',
    '../dataitem',
    'themeprovider',
    '!radio.button.css',
    '!radio.button.html'
],function(require,inheritance,component,events,dom,data){
    "use strict"
    
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var DEFAULT_GROUP = '_default';
    var _buttonGroups = {};
    
    var RadioButton = inheritance.Class(function RadioButton(args){
        this._isSelected = false;
        this.onChange = new events.UnicastEvent(this);
    }).extend(component.ComponentBase);

    RadioButton.Component = factory.define('RadioButton:radio.button.html',RadioButton);

    RadioButton.prototype.onInit = function(args){
        this._isSelected = typeof(args.isSelected) == 'boolean' ? args.state : false;
        this._group = args.group || DEFAULT_GROUP;
    };

    RadioButton.prototype.onLoaded = function() {
        var _this = this;
        this.elements.root.node.onclick = (function(){
            console.log(_this._group);
        });
    };

    RadioButton.prototype.applyContent = function(content) {
        component.ComponentBase.prototype.applyContent.call(this, {label:content});
    };

    function _RadioButton(){
        this._isSelected = !this._isSelected;
        _render.call(this);
    }

    function _render(){
        _decorate.call(this);
        this.onChange.raise(this._isSelected);
        if(this._data!= null){
            this._data.setValue(this._isSelected);
        }       
    }

    function _decorate(){
        if(this._isSelected === true){
            this.getElement('root').addClass('selected');
        } else {
            this.getElement('root').removeClass('selected');
        }
    }

    return RadioButton;
});