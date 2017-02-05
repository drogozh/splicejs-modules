define([

	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
    '{splice.modules}/async',
	'preload|{splice.modules}/component.loader',

],function(require,inheritance,component,event,view,async){


	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase
    ,   Template  = component.Template
    ,   scope = {};


    var DomIterator = Class(function DomIterator(parent,args){
        this.parent = parent;
        this.resolve(parent,args);
        this.loaded(new Template(document.createElement('span')),scope,args);

        this.domContent = args.template;

        if(!args.range) return;

        if(args) {
            this.from = args.range ? args.range[0] : 0;
            this.to = args.range ? args.range[1] : 1;
        }
        console.log('processing dom iterator');
        if(this.domContent){
            // for(var i=this.from; i<this.to; i++){
            // }
            async.loop(this.from,this.to,1,10).for((function(i){
                var c = this.add(this.domContent).set(i);
                return true;
            }).bind(this))
        }

    }).extend(ComponentBase);


    DomIterator.prototype.onDisplay = function(){

    }

    DomIterator.prototype.onChildDisplay = function(child){
       this.parent.onChildChanged();
    }

    /**
     * Input must be a collection or an object
     */
    DomIterator.prototype.dataIn = function(data){
        var keys = Object.keys(data);
        for(var i=0; i<keys.length; i++){
            applyContent.call(this.add(this.domContent),data[keys[i]]);
        }
    }


    function applyContent(content){
        //its a keys content
        if( content.constructor == Object.prototype.constructor || 
            content instanceof Array){
            var keys = Object.keys(content);
            for(var i=0; i<keys.length; i++){
                var l = keys[i];
                var c = content[keys[i]];
                this.set(c,l);
            }        
        } else {
            this.set(content.toString());
        } 

        return this;
    }



    return DomIterator;


})