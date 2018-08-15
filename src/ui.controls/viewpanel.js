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
    }).extend(component.ComponentBase);

    ViewPanel.prototype.onInit = function(args){
        this._views = args.views;
        this._default = args.default;
    };

    ViewPanel.prototype.onLoaded = function(){
        var _this = this;
        var views = collections.collection(this._views)
            .where(function(item,key){
                return key == _this._default;
            })
            .toArray();

        if(views[0]){
            this.replace(views[0]);
        }
    };

    ViewPanel.prototype.switchView = function(name){
        var view = this._views[name];
        this.replace(view);
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

    ViewPanel.Component = factory.define('ViewPanel:viewpanel.html',ViewPanel);

    return ViewPanel;
});