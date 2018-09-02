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
    '!toastmessage.css',
    '!toastmessage.html'
],function(require,inheritance,component,event,dom,data){
    "use strict"
    
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var ToastMessage = inheritance.Class(function ToastMessage(args){
    }).extend(component.ComponentBase);

    ToastMessage.Component = factory.define('ToastMessage:toastmessage.html',ToastMessage);

    ToastMessage.prototype.show = function(message){
        this.applyContent({message: message});
        _display.call(this,true);
        var _this = this;
        setTimeout(function(){
            _display.call(_this,false);
        },1000);
    };

    /**
     * TODO: refactor into ComponentBase
     */
    function _display(isDisplay){
        var _this = this;
        if(isDisplay == true){
            document.body.appendChild(this.node);
            setTimeout(function(){
                _this.elements.root.addClass('visible');
            },1);
        } else {
            _this.elements.root.replaceClass('visible','hide');
        }
    }   

    ToastMessage.show = function(message){
        new ToastMessage.Component().show(message);
    };

    return ToastMessage;
});