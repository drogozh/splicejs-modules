define([
	'require',
    'loader',
	'../inheritance',
	'../component',
	'../event',
	'../view',
    '../async',
    '../dataitem',
    '../collections'
],function(require,loader,inheritance,component,event,Element,_async,di,collections){

	var Class = inheritance.Class
    ,   ComponentBase = component.ComponentBase
    ,   Template  = component.Template
    ,   scope = {};

    var touchSupport = loader.getVar('{touchsupport}');

    var collection = collections.collection;

    var DomIterator = Class(function DomIterator(parent,args){
        this.parent = parent;

        // important! attach event before binding resolution takes place
        event.attach(this,{
            onItemSelected : event.MulticastEvent,
            onItem : event.UnicastEvent,
            onDataUpdated: event.MulticastEvent
        });

        args = this.resolve(args);
        this.init(args);
        
        var rootElement = 'span';
        if(args && args.rootElement) {
            rootElement = args.rootElement;
        }

        // template is cloned when loaded call is complete
        this.loaded({default:new Template(document.createElement(rootElement))},scope);

        this.elements.root = new Element(this.node);

        //#holds a list of items
        this.itemBuffer = [];

        // todo: find a way to extact template type
        this.domContent = args.template;
        
        this.formatter = args.formatter;

        // setup on click handler
        // handler is invoked with data as argument
        // at this point onItemSelected may stil be a binding
        event.attach(this.node,Element.UnicastClickEvent)
            .subscribe(_onItemClicked,this);

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
        var _this = this;
        var foo = function(item){
            return item;
        }
        if(this.formatter != null) {
            foo = function(item){
                return _this.formatter(item);        
            }
        }

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
            cmp.applyContent(foo(data[keys[i]]));
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

        this.onDataUpdated(this.itemBuffer);
    };

    DomIterator.prototype.setTemplate = function(template){
        this.domContent = template;
    };

    // private calls
    function _onItemClicked(args){
        var item = component.locate.visual(args.source,this.contentType);
        var source = component.locate.visual(args.source);
        
        // find index
        var idx = (function(){
            for(var i=0; i < this.itemBuffer.length; i++){
                if(this.itemBuffer[i] == item) {
                    return i;
                }
            }   
            return null;
        }).bind(this)();

        // no item selected
        if(!item)  return;
        this.onItemSelected(item,source,args.source,idx);
    }

    DomIterator.__sjs_is_comp__ = true;

    return DomIterator;
});