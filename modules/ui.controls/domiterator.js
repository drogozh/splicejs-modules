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
        this.parent = parent;
        this.resolve(args,parent);
        this.loaded(new Template(document.createElement('span')));

        this.domContent = args.content;

        if(!args.range) return;

        if(args) {
            this.from = args.range ? args.range[0] : 0;
            this.to = args.range ? args.range[1] : 1;
        }
        
       

        if(this.domContent){
            for(var i=this.from; i<this.to; i++){
                var c = this.domContent(this);
                this.add(c);
                c.applyContent(i);
            }
        }
    }).extend(ComponentBase);

    DomIterator.prototype.onDisplay = function(){

    }
    /**
     * Input must be a collection or an object
     */
    DomIterator.prototype.dataIn = function(data){
        var keys = Object.keys(data);
        for(var i=0; i<keys.length; i++){
            var c = this.domContent(this);
            this.add(c);
            c.applyContent(data[keys[i]]);
        }
    }

    return DomIterator;


})