define([
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
    '../dataitem',
    'themeprovider',
    '!textarea.css',
    '!textarea.html'
],function(require,inheritance,component,event,dom,data,styleProvider){
    "use strict"
    var scope = {};

    var factory = component.ComponentFactory(require,scope);
    var DataItem = data.DataItem;

    var TextArea = inheritance.Class(function TextArea(args){
        event.attach(this,{
            onEnterKey:event.UnicastEvent
        });
    }).extend(component.ComponentBase);

    TextArea.Component = factory.define('TextArea:textarea.html', TextArea);

    TextArea.prototype.onLoaded = function(){
        var _this = this;
        this.elements.root.node.onkeyup = function(){
            _this._data.setValue(this.value);
        }
    };

    TextArea.prototype.applyContent = function(content){
        if(!content) return;
        if(!(content instanceof DataItem)){
            this._data = new DataItem(content);
        } else {
            this._data = content;
        }
        this.elements.root.node.value = this._data.getValue();
    };

    TextArea.prototype.clear = function(){
        this.elements.root.node.value = '';
    };

    return TextArea;
});