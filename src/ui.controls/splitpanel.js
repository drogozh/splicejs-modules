define([
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
    '../interaction',
    'preload|../loader.css',
    'preload|../loader.template',
    '!splitpanel.css',
    '!splitpanel.html'
],function(require,inheritance,component,event,dom,interaction){
    "use strict"
    var scope = {};

    var factory = component.ComponentFactory(require,scope);

    var SplitPanel = inheritance.Class(function SplitPanel(args){
    }).extend(component.ComponentBase);

    SplitPanel.Component = factory.define('SplitPanel:splitpanel.html',SplitPanel);

    SplitPanel.prototype.onInit = function(args){
        this._leftContent = args.leftPanel;
        this._rightContent = args.rightPanel;
        this._isHideRight = args.hideRight;
    };

    SplitPanel.prototype.onLoaded = function(){
        this.applyContent({
            left:this._leftContent,
            right:this._rightContent
        });

        if(this._isHideRight) {
            this.hideRight.call(this);
        }

        // left or top
        this._leftPanel = this.getElement('left-panel');

        // right or bottom
        this._rightPanel = this.getElement('right-panel');
        
        // separator
        this._separator = this.getElement('separator');

        var _this = this;
        
        this._separator.node.onmousedown = function(){

            var _element = this.style;
            var _left = _this._leftPanel.node;
            var _right = _this._rightPanel.node;    

            var position = _measure.call(_this);

            interaction.DragAndDrop.startDrag(this);
            interaction.DragAndDrop.ondrag = function(current,offset,start){
                var p =  {
                    x: current.x - start.x,
                    y: current.y - start.y
                }
                _element.left = (position.x + p.x) + 'px';
                _left.style.width = (position.l + p.x) + 'px';
                _right.style.left = (position.l + p.x) + 'px';
            };
        };
    };

    SplitPanel.prototype.showRight = function(){
        this.getElement('root').removeClass('hide-right');
    };

    SplitPanel.prototype.hideRight = function(){
        this.getElement('root').addClass('hide-right');
    };

    function _measure(){
        return this._position = {
            x: this._separator.node.offsetLeft,
            l: this._leftPanel.node.clientWidth,
            r: this._rightPanel.node.clientWidth
        };
    }

    return SplitPanel;
});