define([
	'require',
    'loader',
	'../inheritance',
	'../component',
	'../event',
	'../view',
    '../async',
    '../dataitem',
    '../collections',
    '!viewpanel.css',
    '!viewpanel.html'
],function(require,loader,inheritance,component,event,Element,_async,di,collections){

    var scope = {};

    var factory = component.ComponentFactory(require, scope);

    var ViewPanel = inheritance.Class(function ViewPanel(){
        this._viewInstances = [];
    }).extend(component.ComponentBase);

    ViewPanel.prototype.onInit = function(args){
        this._views = args.views;
        this._default = args.default;
    };

    ViewPanel.prototype.onLoaded = function(){
        var _this = this;
        if(this._default != null) {
            this.switchView(this._default);
        }
        // var views = collections.collection(this._views)
        //     .where(function(item,key){
        //         return key == _this._default;
        //     })
        //     .toArray();

        // if(views[0]){
        //     this.replace(views[0]);
        // }
    };

    ViewPanel.prototype.switchView = function(name){
        var viewInstance = this._viewInstances[name];
        if(viewInstance == null) {
            if(typeof this._views[name] === 'function'){
                viewInstance = this._viewInstances[name] = new this._views[name](this);    
            }
            else {
                viewInstance = this._viewInstances[name] = this._views[name];    
            }
            
        }
        this.replace(viewInstance);
    };

    ViewPanel.prototype.addView = function(name,view){
        if(this._views[name] != null) {
            return this; 
        }
        this._views[name] = view;
    };

    ViewPanel.prototype.viewExists = function(name){
        return this._views[name] != null;
    };

    ViewPanel.prototype.removeView = function(name){
        this._views[name] = null;
        return this;
    };

    ViewPanel.prototype.getView = function(name){
        return this._viewInstances[name];
    };

    ViewPanel.Component = factory.define('ViewPanel:viewpanel.html',ViewPanel);

    return ViewPanel;
});