define([
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
    '../../lib/d3.min',
	'!chart.css',
	'!chart.html',
],function(require,inheritance,component,event,element){
	"use strict"
    var scope = {};
	
	var	Class = inheritance.Class
    ,   factory = component.ComponentFactory(require,scope);

    var Chart = Class(function Chart(){
    }).extend(component.ComponentBase);

    Chart.Component = factory.define('Chart:chart.html', Chart);

    Chart.prototype.onLoaded = function(){
        this._svg = d3.select(this.elements.canvas.node);
        this._canvas = this._svg.append("g");
    }

    Chart.prototype.onDisplay = function(){
        this.reflow();
    }

    Chart.prototype.reflow = function(){
        var width = this.elements.root.node.clientWidth;
        var height = this.elements.root.node.clientHeight;
        this._svg.attr("width", width).attr("height", height);
    }

    Chart.prototype.applyContent = function(content){
        console.log('chart content',content);      
        if(content === undefined) return;
        
        //var x = d3.scaleLinear().doman

    };

    return Chart;    
});