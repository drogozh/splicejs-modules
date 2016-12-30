define([

	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
	'preload|{splice.modules}/component.loader',

],function(require,inheritance,component,event,view){


	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase
    ,   Template  = component.Template;


    var DomIterator = Class(function DomIterator(args,parent){
        this.loaded(new Template(document.createElement('span')));
        
        if(args) {
            this.from = args.from ? args.from : 0;
            this.to = args.to ? args.to : 1;
        }
        
        if(args && args.content){
            for(var i=this.from; i<this.to; i++){
                var c = args.content(this);
                this.add(c);
                c.replace('foo' + i,'subtitle');
            }
        }
    }).extend(ComponentBase);

    DomIterator.prototype.onDisplay = function(){

    }

    return DomIterator;


})