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

    var Collection = collections.Collection;
    var DataItem = di.DataItem;

    var DomIterator = Class(function DomIterator(parent,args){
        this.parent = parent;

        // important! attach event before binding resolution takes place
        event.attach(this,{
            onItemSelected : event.MulticastEvent,
            onItem : event.UnicastEvent,
            onDataUpdated: event.MulticastEvent,
            // todo:    separate event for items of data
            //          element etc...
            // todo: refactor to remove other events
            onSelectedItem: event.UnicastEvent
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

        this.headerTemplate = args.headerTemplate;
        
        this.formatter = args.formatter;

        this.emptyMessage = args.emptyMessage;

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

    DomIterator.prototype.applyContent = function(content){
        if(!content) return;
        this.dataIn(content);
    };

    DomIterator.prototype.update = function(item){
        var iterator = this._data.iterator();
        while(iterator.next()){
            if(iterator.current == item){
                break;
            }
        }
        var cmp = this.itemBuffer[iterator.key];
        // item to update is not found
        if(cmp == null) {
            return;
        }
        cmp.applyContent(iterator.current);
    };

    DomIterator.prototype.clear = function(){
        this._data = null;
        this.itemBuffer = [];
        // todo use component API
        this.node.innerHTML = "";
        this._header = null;
    };

    // argument must be a collection or an object
    DomIterator.prototype.dataIn = function dataIn(sourceData){
        var _this = this;
        
        var foo = function(item){
            return item;
        }
        if(this.formatter != null) {
            foo = function(item,key){
                return _this.formatter(item,key);        
            }
        }

        // add header
        if(this._header == null && this.headerTemplate != null) {
            this._header = this.add(this.headerTemplate);
        }
        
        if(sourceData instanceof DataItem){
            this._data = new Collection(sourceData.getValue());
        } 
        else if(sourceData instanceof Collection){
            this._data = sourceData;
        } else {
            this._data = new Collection(sourceData);
        }
       
        // update existing or add new
        var i=0;
        var iterator = this._data.iterator();
        while(iterator.next()){
           
            var cmp =  this.itemBuffer[i];
            if(!cmp) {
                cmp = this.add(this.domContent);
                this.itemBuffer.push(cmp);
                this.contentType = cmp.constructor;
            }
            cmp.node.__sjs_domiterator_idx = i;
            cmp.applyContent(foo(iterator.current,iterator.key));
            this.onItem(cmp);
            i++;
        }

        //difference
        var d = this.itemBuffer.length - i

        // remove extras
        while(d--){
            var cmp = this.itemBuffer[i];
            this.itemBuffer.splice(i,1);
            cmp.detach();
        }

        this.onDataUpdated(this.itemBuffer);
    };

    DomIterator.prototype.refreshContent = function(keys){
        console.log(keys);
    };

    DomIterator.prototype.setTemplate = function(template){
        this.domContent = template;
        this.clear();
    };

    DomIterator.prototype.setHeaderTemplate = function(template){
        this.headerTemplate = template;
        this.clear();
    };

    DomIterator.prototype.findItem = function(func){
        if(!func) return null;
        for(var i=0; i< this.itemBuffer.length; i++){
            var item = this.itemBuffer[i]; 
            if(func(item) === true){
                return item; 
            }
        }
    };

    // private calls
    function _onItemClicked(args){
        var source = component.locate.visual(args.source);
        var parent = args.source;
        var idx = null;
        while(parent!= null) {
            var idx = parent.__sjs_domiterator_idx;
            if(idx != null) break;
            parent = parent.parentNode;
        }
        
        if(idx == null)  return;
        
        this.onItemSelected({
            data:this._data.forIndex(idx),
            rowComponent:this.itemBuffer[idx],
            index:idx,
            srcElement: args.source,
            srcComponent: source,
        });
    }

    DomIterator.__sjs_is_comp__ = true;

    return DomIterator;
});