define([
	'require',
    'loader',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
    '{splice.modules}/async',
    '{splice.modules}/dataitem'
],function(require,loader,inheritance,component,event,Element,_async,di){

	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase
    ,   Template  = component.Template
    ,   scope = {};

    var touchSupport = loader.getVar('{touchsupport}');

    var DomIterator = Class(function DomIterator(parent,args){
        this.parent = parent;
        this.init(args);
        
        // important! attach event before binding resolution takes place
        event.attach(this,{
            onItemSelected : event.MulticastEvent,
            onItem : event.UnicastEvent
        });
        
        this.resolve();
        
        // template is cloned when loaded call is complete
        this.loaded({default:new Template(document.createElement('span'))},scope);

        this.elements.root = new Element(this.node);

        //#holds a list of items
        this.itemBuffer = [];

        // todo: find a way to extact template type
        this.domContent = args.template;
        

        // setup on click handler
        // handler is invoked with data as argument
        // at this point onItemSelected may stil be a binding
        if(args.onItemSelected){
           event.attach(this.node,Element.UnicastClickEvent)
                .subscribe(_onItemClicked,this);
        }

        if(!args.range) return;

        if(args) {
            this.from = args.range ? args.range[0] : 0;
            this.to = args.range ? args.range[1] : 1;
        }
        
        if(!this.pageSize || this.pageSize < 1) this.pageSize = 1; 

        if(this.domContent){
            _async.loop(this.from,this.to,this.pageSize,1).for((function(i){
                var c = this.add(this.domContent);
                c.set(i);
                this.itemBuffer.push(c);
                return true;
            }).bind(this))
        }
    }).extend(ComponentBase);
    
    DomIterator.prototype.onChildDisplay = function(child){
       // intended to notify parent of the change
       this.parent.onChildChanged();
    };

    // argument must be a collection or an object
    DomIterator.prototype.dataIn = function dataIn(data){
        var keys = Object.keys(data);

        // update existing or add new
        for(var i=0; i<keys.length; i++){
            var cmp =  this.itemBuffer[i];
            if(!cmp) {
                cmp = this.add(this.domContent); 
                this.itemBuffer.push(cmp);
                this.contentType = cmp.constructor;
            }

            // record item type, ideally this should be done once
            cmp.applyContent(_convert.call(this,data[keys[i]]));
            this.onItem(cmp);
        }

        //difference
        var d = this.itemBuffer.length - keys.length

        // remove extras
        while(d--){
            var cmp = this.itemBuffer[keys.length];
            this.itemBuffer.splice(keys.length,1);
            cmp.detach();
        }
    };

    // private calls
    function _onItemClicked(args){
        console.log(args.source);
        var item = component.locate.visual(args.source,this.contentType);
        var source = component.locate.visual(args.source);
        // no item selected
        if(!item)  return;
        this.onItemSelected(item,source);
    }

    // passthrough data if converter is not defined or convert
    function _convert(data) {
        if(!this.converter) return data;
        return this.converter(data);
    }

    return DomIterator;
});