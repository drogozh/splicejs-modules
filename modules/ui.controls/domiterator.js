define([

	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
    '{splice.modules}/async',
    '{splice.modules}/dataitem',
	'preload|{splice.modules}/component.loader',

],function(require,inheritance,component,event,Element,async,di){


	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase
    ,   Template  = component.Template
    ,   scope = {};


    var DomIterator = Class(function DomIterator(parent,args){
        this.parent = parent;
        this.init(args);
        this.resolve(parent,args);
        
        // template is cloned when loaded call is complete
        this.loaded(new Template(document.createElement('span')),scope,args);

        this.elements.root = new Element(this.node);

        //#holds a list of items
        this.itemBuffer = [];


        this.domContent = args.template;

        // setup on click handler
        // handler is invoked with data as argument
        // at this point onItemSelected may stil be a binding
        if(args.onItemSelected){
            event.attach(this.node, {
                onclick : Element.DomUnicastEvent
            }).onclick.subscribe(_onItemClicked,this);    
        }

        if(!args.range) return;

        if(args) {
            this.from = args.range ? args.range[0] : 0;
            this.to = args.range ? args.range[1] : 1;
        }
        
        if(!this.pageSize || this.pageSize < 1) this.pageSize = 1; 

        if(this.domContent){
            // for(var i=this.from; i<=this.to; i++){
            //       var c = this.add(this.domContent).set(i);
            // }
            async.loop(this.from,this.to,this.pageSize,1).for((function(i){
                var c = this.add(this.domContent);
                c.set(i);
                this.itemBuffer.push(c);
                return true;
            }).bind(this))
        }

    }).extend(ComponentBase);


    DomIterator.prototype.onAttach = function(){
        
    }

    DomIterator.prototype.onChildDisplay = function(child){
       this.parent.onChildChanged();
    }

    // argument must be a collection or an object
    DomIterator.prototype.dataIn = function dataIn(data){
        var keys = Object.keys(data);
        for(var i=0; i<keys.length; i++){
            //todo: use ComponentBase.prototype.applyContent
            var cmp = this.add(this.domContent); 
            
            _applyContent.call(cmp,data[keys[i]],i);
        }
    }

    // private calls
    function _onItemClicked(args){
        console.log('item clicked');
        console.log(args.source);
    }



    //todo: use ComponentBase API
    function _applyContent(content, idx){
        //its a keys content
        if( content.constructor == Object.prototype.constructor || 
            content instanceof Array){
            var keys = Object.keys(content);
            for(var i=0; i<keys.length; i++){
                var l = keys[i];
                var c = content[keys[i]];
                this.set(c,l,idx);
            }        
        } else {
            this.set(content.toString(),idx);
        } 

        return this;
    }



    return DomIterator;


})