define([
    'require',
    '../inheritance',
    '../component',
    '../events',
    '../view',
    '../dataitem',
    'themeprovider',
    '!toggle.css',
    '!toggle.html'
],function(require,inheritance,component,events,dom,data){
    "use strict"
    
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var Toggle = inheritance.Class(function Toggle(args){
        this._state = false;
        this.onChange = new events.UnicastEvent();
    }).extend(component.ComponentBase);

    Toggle.Component = factory.define('Toggle:toggle.html',Toggle);

    Toggle.prototype.onLoaded = function(){
        this.getElement('thumb').node.onclick = _toggle.bind(this);
    };

    Toggle.prototype.applyContent = function(content){
        if(typeof(content) != 'boolean') return;
        this._state = content;
        _decorate.call(this);
        console.log(content);
    };

    function _toggle(){
        this._state = !this._state;
        _decorate.call(this);
        this.onChange.raise(this._state);
    }

    function _decorate(){
        if(this._state === true){
            this.getElement('root').replaceClass('off','on');
        } else {
            this.getElement('root').replaceClass('on','off');
        }
    }

    return Toggle;
});