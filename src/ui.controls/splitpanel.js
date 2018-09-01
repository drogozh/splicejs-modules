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
    };

    SplitPanel.prototype.onLoaded = function(){
        this.applyContent({
            left:this._leftContent,
            right:this._rightContent
        });

        // left or top
        var _leftPanel = this.getElement('left-panel');
        // right or bottom
        var _rightPanel = this.getElement('right-panel');

        this.getElement('separator').node.onmousedown = function(){

            var _element = this.style;
            var _left = _leftPanel.node;
            var _right = _rightPanel.node;    

            var position = {
                x:  this.offsetLeft,
                l: _left.clientWidth,
                r: _right.clientWidth
            };

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
    return SplitPanel;
});