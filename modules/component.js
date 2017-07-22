define([
    'inheritance',
    'event',
    'document',
    'dataitem',
    'util',
    'animation',
    'view',
    'binding',
    'preload|loader.template'
],
//todo: Component mode supports data-driven component selection
//requires unicast event handler to return a value

//todo: add new attribute to the <include> tag
//sjs-vm and sjs-template to allow including adhoc components
//based on:
// new template         new vm
// existing template    new vm
// new template         existing vm 

// todo: locating content children within parent item required work
// content:<div sjs-name="sub"></div>
// create new property to collect markup attributes _markup_
// component call can then be used to search component tree and locate
// sought component

//todo:
//undefined template cause inifinite-loop behavior
//<template sjs-name="SomeControl"></template>

//todo:
//consider component intance having a queueue that is processed 
//when component is already
//also, items in the queue can have a prerequsite for example
//process on load or on resize etc..

//todo:
// review ALL of the component reflow design

//todo:
// implement light template allocation, where child component proxies are not invoked
function(inheritance,events,doc,data,utils,effects,Element,_binding){
    "use strict";

    var TAG_INCLUDE = 'INCLUDE'
    ,   TAG_TEMPLATE = 'TEMPLATE'
    ,   TAG_ELEMENT = 'ELEMENT';

    var DISPLAY_DELAYED = -1
    ,   DISPLAY_FALSE = 0
    ,   DISPLAY_TRUE = 1;

    var log = {
        debug:function(){}
    };

    var DataItem = data.DataItem
    ,   foreach = utils.foreach
    ,   Class = inheritance.Class
    ,   mixin = utils.mixin
    ,   Animation = effects.Animation
    ,   Binding = _binding;

    /**
     *  Listens for template loader
     */
    function Listener(){
        events.attach(this,{'onloaded':events.MulticastQueueEvent});
    }

    /**
     * @param scope - scope object passed to a component factory
     */
    Listener.prototype.loaded = function(collection,scope){	
        //compile templates
        this.compiledTemplates = {};
        var keys = Object.keys(collection);

  		for(var i = 0; i < keys.length; i++) {
            this.compiledTemplates[keys[i]] = this.compiledTemplates[keys[i]] || {};
            for(var j = 0; j < collection[keys[i]].length; j++){
                var tSource = collection[keys[i]][j];
                var key = tSource.key || 'default';
                this.compiledTemplates[keys[i]][key] = new Template(tSource.node.cloneNode(true),keys[i],tSource.key).compile(scope);
            }
  		}
        this.isLoaded = true;
        this.onloaded(this.compiledTemplates);
    }

    Listener.prototype.ready = function(fn){
        if(this.isLoaded) {
            fn(this.compiledTemplates)
            return;
        } 
        this.onloaded.subscribe(fn);
    }
    
    function ComponentFactory(require,scope){
        if(!(this instanceof ComponentFactory)) {
            return new ComponentFactory(require,scope);
        }
        this.require = require;
        this.scope = scope;
        this.listeners = {};
        this.compiledTemplates = {};
    }

    ComponentFactory.prototype.define = function(templateLocation, controller, defaultArgs){
        var templateName =  templateLocation.split(':')[0];
        var templateFile =  templateLocation.split(':')[1];

        // set default controller
        controller = controller || ComponentBase;

        // set listener
        var listener = this.listeners[templateFile];
        if(!listener){
            listener = this.listeners[templateFile] = new Listener();
            // load template
            this.require('!'+templateFile, (function(collection){
               listener.loaded(collection, this.scope);
            }).bind(this));
        }

        var scope = this.scope;
        // component constructor
        var component = function Component(parent,args){
            var comp = new controller(parent,args);
            comp.parent = parent;
            comp._templateName_ = templateName; 
            comp.init(args);
            comp.resolve();
           
            listener.ready((function(t){
                // reference to  componentConstructor function
                comp.constructor._templates_ = t[templateName];
                this.loaded(t[templateName],scope,args)
            }).bind(comp));

            return comp;
        };
        
        component.prototype = controller.prototype;
        component.is = function(type){
            if(type.constructor ==  controller.prototype.constructor)
            if(type._templateName_ == templateName ) return true;
        }
        return component;
    }

    /**
     * Top level pseudo component
     */
    var DocumentBody = {
        displayChild:function(child){
            if(!child || !child.node) return;
            if(document.body == child.node) return;
            
            var animation = isAnimation.call(child);
            document.body.appendChild(child.node);
            
            child._state_ = {parent:this};

            if(animation) animation.animate();

            setTimeout((function(){
                child.onAttach();
                child.onDisplay();
            }).bind(this),1);

        }, 
        detachChild:function(child){
            document.body.removeChild(child.node);
        }
    };

    /** 
     *  Component event pool 
     * 
     */
    
    function ComponentEventMap(){

    }
    
    ComponentEventMap.prototype = {
        onLoaded:function(callback, instance){
            return this;
        }
    };


    /**
     * Base Component
     */
    function ComponentBase(){}

    //interface callbacks, intended for override
    ComponentBase.prototype.onInit = 
    ComponentBase.prototype.onLoaded = 
    ComponentBase.prototype.onSelectTemplate = 
    ComponentBase.prototype.onAttach = 
    ComponentBase.prototype.onDetach =
    ComponentBase.prototype.onDisplay =
    ComponentBase.prototype.onHide =
    ComponentBase.prototype.onResolve =  
    ComponentBase.prototype.onChildChanged =
    ComponentBase.prototype.onChildDisplay =
    ComponentBase.prototype.onDispose =
    ComponentBase.prototype.onApplyContent = 
    ComponentBase.prototype.onResize  = function(){};


    ComponentBase.prototype.init = function(args){
        this._state_ = {};
        this._action_queue_ = []; 
        
        // default reflow mode is css
        this._reflow_mode_ = 'css';
        
        // stores markup and constructor arguments
        this._args = {
            // binding arguments are separated out from the arguments 
            bindings:[],
            content:null,
            other:{}
        };

        // split arguments
        utils.foreach(args,(function(item, key){
            if(item instanceof Binding){
                item.targetProperty = key;
                this._args.bindings.push(item);
            } 
            else if( key == 'content'){
                this._args.content = item;
            }
            else {
                this._args.other[key] = item;
            }
        }).bind(this));

        // innvoke init callback(event)
        // with sanitized arguments
        this.onInit(this._args.other);
    }

    ComponentBase.prototype.resolve = function(){
        if(!this._args.bindings ||this._args.bindings.length < 1) return;
        var scope = this.parent.scope;
        foreach(this._args.bindings,(function(value,prop){
            Binding.resolveBinding(value,this,scope);
        }).bind(this));
        this.onResolve();
    }

    ComponentBase.prototype.loaded = function(templates,scope){
        this.isLoaded = true;
        this.scope = scope;
        this.content = {};
        this.templateInstances = {};
        
        // select template
        this._active_template_ = this.onSelectTemplate() || 'default';

        // template instance is created here
        var template = templates[this._active_template_];
        if(!template){
            this._active_template_ = 'default';
            template = templates[this._active_template_];
        }

        // create template instance
        var templateInstance = 
            this.templateInstances[this._active_template_] = 
            template.getInstance(this);
            
        // root node of the component's DOM
        this.node = templateInstance.node;
        this.node._obj_ = this;
       
        //child collection
        //todo: this property should be turned into 'private' 
        //otherwise it could unintentionally overwritten
        //causing strange and hard to debug behaviour
        this.children = {};

        //1. construct element map
        this.elements = templateInstance.elements;

        //2. content map
        this.content = templateInstance.content;

        //3. process included components
        _integrateIncludes.call(this,templateInstance.children);

        //4. process 'content' argument 
        if(this._args.content){
            processCompositionContent.call(this,this._args.content);
        }

        //5. process css arguments
        _processCssArguments.call(this,this._args.other.css);

        //6. process style argument
        _processStyleArguments.call(this,this._args.other.style);

        //notify view model
        this.onLoaded(this._args.other);
        this._args = null;
        delete this._args;
        // after this point arguments do not exist any longer

        //process replacement queue
        //or toadd queue but not both
        //todo: review off-screen state tracking
        var _x = null;
        if(this.toReplace) {
            while(this.toReplace && (_x = this.toReplace.shift()) ) {
                this.set(_x.child, _x.location, _x.meta);
            }
        } else if(this.toAdd){
            while(this.toAdd && (_x = this.toAdd.shift()) ){
                this.add(_x.child,_x.location);
            }
        }

        if(this._state_.display == DISPLAY_DELAYED) this.display(); 
    }

    ComponentBase.prototype.when = function(evtName, callback, instance){
        return this._eventMap_ || new ComponentEventMap();

        // var evt = this._eventMap_[evtName];
        // if(!evt) {
        //     evt = this._eventMap_[evtName] = _attachEvent(evtName);
        // }
    };

    function _processCssArguments(args){
        if(!args) return;
        var root = this.elements.root;
        utils.foreach(args.add.split(','), function(item){
            root.appendClass(item);
        });
    }

    function _processStyleArguments(args) {
        if(!args) return;
        var stl = this.elements.root.node.style;
        var keys = Object.keys(args);
        for(var i=0; i< keys.length; i++) {
            stl[keys[i]] = args[keys[i]];
        }
    }


    function _subscribeToQueue(queueName, callback){

    }


    //   all includes must be derived from ComponentBase
    //   check for any content overrides
    //   includes are special types of children and processed separately from any other content child
    //   this is because they are a part of template composition
    function _integrateIncludes(includes){

        this.components = {};
        var keys = Object.keys(includes);
        for(var key in keys){
            var inc = includes[keys[key]];
                            
            var args = inc.includeArgs;
            
            if(!args) continue;
            
            if(args.name){
                this.components[args.name] = inc.component;
            }

            if(!args.content) continue;
            this.content[args.content] = inc.component;
        }

        this._includes = includes;
    }




    // typeof the content
    // 1. proxy
    // 2. value type
    // 3. component instance
    // 4. content key value object
    function processCompositionContent(content){
        content = toComponent(content,this);
        this.set(content);
    }

    
    ComponentBase.prototype.getComponent = function(name){
        if(!this.components) throw 'Components collection is empty';
        if(!this.components[name]) throw 'Component ['+name+'] is not found';
        return this.components[name];
    }

    ComponentBase.prototype.getElement = function(name){
        if(!this.elements) throw 'Elements collection is empty';
        if(!this.elements[name]) throw 'Element [' + name + '] is not found';
        if(this.elements[name] instanceof Element ) 
            return this.elements[name];
        return this.elements[name] = Element(this.elements[name]);
    }

    ComponentBase.prototype.displayChild = function(child,key,mode){
        var _state_ = child._state_;

        if(mode == 'include'){
            target = this._includes[key].anchor;
            // this here means that include child is no londer required
            if(!target.parentNode){
                //delete all the references of the include is
                delete this.content[child.includeId]; 
                return;
            }
            target.parentNode.replaceChild(child.node,target);            
            
            _state_.parent = this;
            _state_.key = key; 
            _state_.mode = mode;
            
            return;
        }

        key = key || 'default';
        var target = this.content[key];

        _state_.parent = this;
        _state_.key = key; 
        _state_.mode = mode;

        var animation = isAnimation.call(child);

        if(!target) {
            //console.warn('Content target for ' + key + ' is not found, content is not rendered');
            return;
        }

        if(mode == 'add'){
            target.node.appendChild(child.node);
        }

        if(mode == 'set'){
            target.node.innerHTML = '';
            target.node.appendChild(child.node);
        }

        if(mode == 'rem'){
            //decode the type of child
        }

        if(animation != null) animation.animate();

    }

    ComponentBase.prototype.detachChild = function(child){
        child.node.parentNode.removeChild(child.node);
    }

    ComponentBase.prototype.detach = function(){
        if(!this._state_.parent) {
           console.log('Unable to detach orphaned component');
           return;
        }
        this._state_.parent.detachChild(this);
        
        //set state
        this._state_.display = DISPLAY_FALSE;
        this._state_.parent = null;
        this.onDetach();
    }

    /**
     * what
     * where 
     * how
     */
    ComponentBase.prototype.display = function(parent,key,mode){
        //start display
        var timeStart= window.performance.now();

        //component is displayed already
        if(this._state_.display == DISPLAY_TRUE) { 
            return this; 
        }

        //component's templpate is yet to load
        if(!this.isLoaded){
            this._state_.display = DISPLAY_DELAYED;
            //switcheroo
            var fn = this.display;
            this.display = function(){
                fn.call(this,parent,key,mode);
                this.display = fn;
            };
            return this;
        }

        parent = parent || DocumentBody;
        key = key || 'default';
        mode = mode || 'add';
        
      
        
        var keys = Object.keys(this._includes);
        for(var i in keys){
            this._includes[keys[i]].component.display(this,keys[i],'include');
        }

        
        foreach(this.children,(function(list,key){
            for(var i=0; i < list.length; i++){
                var child = list[i];
                child[0].display(this,key,child[1]);
                this.onChildDisplay(child[0]);
            }                 
        }).bind(this));

        parent.displayChild(this,key,mode);  
        this._state_.display = DISPLAY_TRUE;

        var timeEnd = window.performance.now();

        log.debug(this.constructor.name,timeStart,timeEnd, timeEnd-timeStart);
        setTimeout((function(){
            this.onAttach();
            this.onDisplay();
        }).bind(this),1);
        return this;
    };
       
    ComponentBase.prototype.isAttached = function(){
        return this._state_.display == DISPLAY_TRUE;
    };

    /**
     * Append content child and a content location
     */
    ComponentBase.prototype.add = function(child,key){
         //queue replacement if component is not loaded yet
        if(!this.isLoaded ) {
            this.toAdd = this.toAdd || [];
            this.toAdd.push({child:child, location:key});
            return child;
        }
        
        key = key || 'default';

        child = toComponent(child,this);

        var content = this.content[key];
        
        if(!content) return; //no target found

        var target = this.children[key];
        if(!target) {
            this.children[key] = target = [];
        }

        child.parent = this;
        target.push([child,'add']);    

        if(this._state_.display) {
            child.display(this,key,'add');
        }
       
        return child;
    }

    
    ComponentBase.prototype.activateTemplate = function(key){
        if(this._active_template_ == key) return;
        var templates = this.constructor._templates_;
        if(!templates) return;

        var instance = this.templateInstances[key];
        if(instance == null){
            var target = templates[key];
            if(!target) return;
            instance = target.getInstance(this);
            this.templateInstances[key] = instance;
        }

        var current = this.templateInstances[this._active_template_];
        var currentParentNode = this.node.parentNode;
        var selfNode = this.node.parentNode;

        // migrate elements from current to the new instance
        utils.foreach(current.elements, function(from,key){
            if(key == 'root') return;
            var te = instance.elements[key];
            if(from._reflowMigrateIgnore) { 
                te.swap(from);                
                return;
            }
            _swapElements(from,te); // dom swap
        });

        // migrate content
        
        utils.foreach(current.content,function(from,key){
            var te = instance.content[key];
            // when content is also an element
            //detect migration and ignore
            if(_findParentInstance(from.node, instance.node)) { 
                 //te.swap(from);      
                return;
            }
            _swapElements(from,te);
        });


        // migrate included components
        // todo: do something with this nested loop
        utils.foreach(current.children,function(from){
            utils.foreach(instance.children,function(child){
                if(child.includeArgs.name != from.includeArgs.name) return;
                // check if component is already migrated
                if(_findParentInstance(from.component.node, instance.node)){
                    return;
                }

                if(!from.component.node.parentNode) {
                    return;
                }

                //do replacement here
                from.component.node.parentNode.replaceChild(from.anchor, from.component.node);
                child.component = from.component;
                child.anchor.parentNode.replaceChild(from.component.node, child.anchor);
            })
        });

        this._active_template_ = key;

        // component might have been detached from the dom
        if(this._state_.display > 0) {
            this.node.parentNode.replaceChild(instance.node,this.node);
        }
        this.node = instance.node;
    };

    
    function _findParentInstance(source,parent){
        while(source){
            if(source == parent) return true;
            source = source.parentNode;
        }
        return false;
    }

    function _swapElements(e1,e2){
        var cursor = document.createElement('span');
        var p1 = e1.node.parentNode;
        var p2 = e2.node.parentNode;
        
        // element and content are the same node and already swapped
        if(!p1 || !p2) return; 

        p2.replaceChild(cursor,e2.node);
        p1.replaceChild(e2.node,e1.node);
        p2.replaceChild(e1.node,cursor);
    }

    /**
     * Remove content child at location
     * if content location contains only a single child then
     * child parameter could be blank
     * Child knows its location
     */
    ComponentBase.prototype.remove = function(child){

    }

    ComponentBase.prototype.swap = function(oldChild,newChild){

    }

    
    // Replaces content at provided location
    // onset is only called on loaded components
    ComponentBase.prototype.set = function(child, key, meta){
        //queue replacement if component is not loaded yet
        if(!this.isLoaded ) {
            this.toReplace = this.toReplace || [];
            this.toReplace.push({child:child, location:key, meta:meta});
            return child;
        }
        //nothing to do here, if placement is not set
        key = key || 'default';
        
        // we could be dealing with an object that is yet to be loaded
        // content collection is a collection of containers that may accept
        // content
        var content = this.content != null ? this.content[key] : null;
        
        //push forward
        if(content instanceof ComponentBase){
            return content.set(child);
        }

        //convert child
        child = toComponent(child,this);

        var target = this.children[key];
       

        if( target && target[0] && 
            target[0][0] instanceof ValueComponent && 
            child instanceof ValueComponent) {
            target[0][0].set(child.toString());
            return child;
        } 
        
        // if child by the same key exists detach them
        // 0 is an item index
        if(this.children[key]){
            for(var i=0; i<this.children[key].length; i++){
                this.children[key][i][0].detach();
            }
        }
        
        this.children[key]= [[child,'set']];
        child.parent = this;


        if(this._state_.display) { 
            child.display(this,key,'set');
            this.onChildDisplay(child);
        }

        // set metadata on component' node
        if(meta){
            this.node._meta_ = meta;
        }

        return child;
    }

    ComponentBase.prototype.applyContent = function(content){
        if(typeof content === 'string' || typeof content === 'number') {
            this.set(content.toString());
        }
        //its a keys content
        else if( content.constructor === Object.prototype.constructor ||
                 content.constructor === Array.prototype.constructor){
            var keys = Object.keys(content);
            for(var i=0; i<keys.length; i++){
                var l = keys[i];
                var c = content[keys[i]];
                this.set(c,l);
            }        
        }         
        else {
            this.set(content);
        }
        this.onApplyContent(content); 
        return this;
    }

        /**
     * Returns true if component is attached to display tree
     */
    ComponentBase.prototype.isVisible = function(){
        if(!this.node) return false;
        var parent = this.node.parentNode;
        var visRoot = doc.visualRoot();

        var scroll = {
            top:0,
            left:0
        };

        var offset = {
            top:this.node.offsetTop,
            left:this.node.offsetLeft
        };

        while(parent != null) {
            console.log('scroll: ' + parent.scrollTop);
            
            //offset positions
            offset.top += parent.offsetTop;
            offset.left +=

            
            // scroll positions
            scroll.top+= (parent.scrollTop ? parent.scrollTop : 0);
            scroll.left+= (parent.scrollLeft ? parent.scrollLeft : 0);
                      
            if(parent == visRoot) break;
            parent = parent.parentNode;
        }
        // no visual root was found, component is detached
        if(parent == null) return false;

        // get the component box and 
        // calculate for scroll positions
        var box = Element.box(this.node);
    };

    /**
     * 
     */
    function isAnimation(){
        var animation = null;
        if(this.animated && this instanceof ComponentBase){
            var style = this.node.style;
            style.opacity = 0;
            animation = new effects.StoryBoard([new Animation(0,100,300,Animation.cubicEaseIn,
            function(value){
                style.opacity = value * 0.1 / 10;
            })]);  
        }
        return animation;
    }


    /**
     * Converts anything to a component
     * Content can be:
     * 1. base object
     * 2. Array
     * 3. Value type
     * 4. proxy
     * 5. ComponentBase instance
     * 6. Anything else is turned to a string
     */
    function toComponent(s, parent){
        //check for proxy
        //todo: see if we care what the resulting proxy instance is
        if(typeof s === 'function' && s.isProxy === true ){
            return s(parent,s.proxyArgs.args);
        }

        //on ComponentBase instances, just return
        if(s instanceof ComponentBase){
            return s;
        }

        //on ValueComponent instances, return
        if(s instanceof ValueComponent){
            return s;
        }
        
        //all else is a new ValueComponent
        return new ValueComponent(s.toString());
    }

    ComponentBase.prototype.reflow = function(x,y,w,h,b){
        if(!this.node) return;

        if(this._reflow_mode_ !== 'css') {
            _applyReflow.call(this, x, y, w, h, b);
        }

        // reflow includes
        foreach(this._includes,function(inc){
            if(!inc.component) return;
            inc.component.reflow(null, null, w, h);
        });

        // reflow children
        foreach(this.children,function(child){
            for(var i=0; i<child.length; i++ ){
                var comp = child[i][0];
                if(!comp.reflow) continue;
                comp.reflow(x, y, w, h);
            }
            // if(child instanceof ComponentBase &&  child.layout == "container"){
            //     child.reflow(null, null, w, h);
            // }    
        });
    }

    function _applyReflow(x,y,w,h,b){
        var style = this.node.style;
        if(x != null)
            style.left = x + 'px';
        if(y != null)
            style.top = y + 'px';
        

        var box = Element.box(this.node).unit();

        if(w !=null ) {
            w = w - box.padding.left.value 
                  - box.padding.right.value
                  - box.margin.left.value
                  - box.margin.right.value;

            style.width = w + 'px';
        }

        if(h != null) {
            h = h - box.padding.top.value
                  - box.padding.bottom.value
                  - box.margin.top.value
                  - box.margin.bottom.value;

            style.height = h + 'px';
        }
    }

    /**
     * 
     */
    function ValueComponent(value){
        this.node = document.createTextNode(value);
        this._state_ = {};
    }

    //do nothing on display
    //parent is a display parent
    ValueComponent.prototype.display = function(parent,key,mode){
        parent.displayChild(this,key,mode);
    }; 


    ValueComponent.prototype.set = function(value){
        this.node.nodeValue = value.toString();
    };
    //override toString
    ValueComponent.prototype.toString = function(){
        if(this.node.nodeValue == null) return '';
        return this.node.nodeValue.toString();
    }

    //todo: how about tryng string-based template components
    //to utilize innerHTML behavior for complex data controls

    /** 
     *  Template
     */
    function Template(node,name,key){
        this.node = node;
        this.key = key;
        //when top-level template child element is include
        //wrap it into span
        if(node.tagName == TAG_INCLUDE) {
            this.node = document.createElement('span');
            this.node.appendChild(node);    
        }

        this.name = name;
        this.children = {};
        this.childCount = 0;
    }
   
    Template.prototype.addChild = function(json){
    	var childId =  this.childCount++;

        this.children['child'+childId] = {
            json:json
        };
        
        var a = document.createElement('a');
  		a.setAttribute('sjs-child-id',	childId);
        
  		return a;
    }

    Template.prototype.clone = function(){
        return this.node.cloneNode(true);
    }


    /**
  	 * Creates a build version of the template (dom element but not linked to main document yet).
  	 * This will not generate any bindings but rather encode  information into elements through data-...
  	 *
  	 * @param template - template to compile
  	 * @returns Template a DOM of the template (aka build version).
     * @param scope - component factory scope argument  
  	 */
    Template.prototype.compile = function(scope){

        var template = this;

        template.isCompiled = true;

        //set adhoc component counter
        if(scope.__sjs_adhoc__ == null) scope.__sjs_adhoc__ = 0; 


        //select top level includes
        var inclusions = [];

        //selects only direct child nodes
        var nodes = doc.select.nodes(
            {childNodes:template.node.childNodes},
            function(node){
                if(node.tagName == TAG_INCLUDE || node.tagName == TAG_ELEMENT) return node;
            },
            function(node){
                if(node.tagName == TAG_INCLUDE || node.tagName == TAG_ELEMENT) return [];
                return node.childNodes;
            }
        );

        if(!nodes || nodes.length < 1) return template;

        for(var i=0; i<nodes.length; i++){
            var node = nodes[i]
            ,	parent = node.parentNode;
            
            var	json = _convertToProxyJson.call(scope, node, node.tagName,false,this);
            
            //create placeholder anchor           
            var a = template.addChild(json);
            
            //replace current node with a placeholder anchor
            parent.replaceChild(a,node);
        }

        
        return template;    
    }

    /**
     * Clones template's DOM and returns it
     * @param {ComponentBase} component - component instance requesting template instance
     */
    Template.prototype.getInstance = function(component){
        var clone = this.clone()
        ,   _anchors = clone.querySelectorAll('[sjs-child-id]');

        var aMap = {};
        utils.foreach(_anchors,function(a){
            if(!a.getAttribute) return;
            aMap['child'+a.getAttribute('sjs-child-id')] = a;
        });

        var includes = {};
        var keys = Object.keys(this.children);
        for(var i=0; i < keys.length; i++){
            var r = _runProxy(component,this.children[keys[i]].json);
            
            includes[keys[i]] = {
                component:r.result,
                includeArgs:r.proxyArgs,
                anchor:aMap[keys[i]]    
            }            
        }

        this.elements = _buildElementMap(clone);
        this.content = _buildContentMap(clone);

        return {
            node:clone,
            children:includes,
            elements:this.elements,
            content:this.content
        }
    }

    function _buildElementMap(node){
        var element = node;
        var elementNodes = element.querySelectorAll('[sjs-element]');
        
        var elementMap = {};
        var node = element;
        // tamplate root
        elementMap['root'] = Element(node);
        elementMap['root'].name = 'root';
        for(var i=-1; i <elementNodes.length; i++){
            if(i>-1)  node = elementNodes[i];

            var attr = node.getAttribute('sjs-element');
            if(!attr) continue;
            var keys = attr.split(' ');
            for(var k=0; k<keys.length; k++){
                var key = keys[k];
                //ignore root, since its a reserved element name
                if(key == 'root') continue;
                if(elementMap[key]) throw 'Duplicate name map key ' + key;
                
                elementMap[key] = Element(node);
                elementMap[key].name = key;
            }
        }
        return elementMap;
    }


    /**
     * Constructs reference content map to keep track of container nodes
     * @param {*} node : HTMLNode
     */
    function _buildContentMap(node){
        if(node.tagName == 'TEMPLATE')
            node = node.content;

        var contentNodes = node.querySelectorAll('[sjs-content]')
        ,	cMap = {};

        if(!contentNodes || contentNodes.length < 1) {
            cMap['default'] = Element(node);
            return cMap;
        }
        
        for(var i=0; i<=contentNodes.length; i++){
            if(!node.getAttribute) { 
                node = contentNodes[i];
                continue; 
            }
            var attr = node.getAttribute('sjs-content');
            if(!attr) {
                node = contentNodes[i];
                continue;
            }
            var keys = attr.split(' ');
            for(var k=0; k<keys.length; k++){
                var key = keys[k];
                if(cMap[key]) throw 'Duplicate content map key ' + key;
                node.__sjscache__ = {n:0};
                cMap[key] = Element(node);
            }
            node = contentNodes[i];
        }
        return cMap;
    }

    /** 
     * Finds 'type' in 'scope' and creates a new instance of the 
     * 'type' object passing 'args' as contructor arguments
     *  @param scope:DataItem - scope object containing all the types
     *  @param type - type to instantiate, is a fully qualified name within provided scope
     *  @param args - constructor arguments
    */
    function proxy(scope,pArgs){
        var prx =  function proxy(){
            var _type = new DataItem(scope).path(pArgs.type).getValue();
            if(_type == null) throw 'type not found [' + pArgs.type +']';
            var instance = Object.create(_type.prototype);
           
            return _type.apply(instance,arguments) || instance;
        }

        prx.isProxy = true;
        prx.proxyArgs = pArgs;
        return prx;
    }


    /**
     * Constructs dynamic function and exectures proxy json in its context
     */
    function _runProxy(parent,json){
        var	fn = new Function(
            "var proxy = arguments[0][0]; "      +
            "var scope = this;"+
            "var binding = arguments[0][1];" +
            "var window = null; var document = null; return " + json)
            .call(parent.scope,[proxy,binding]);

        var compArgs = fn.proxyArgs.args;
        
        //remove component constructor arguments
        delete fn.proxyArgs.args;

        return {
            proxyArgs:fn.proxyArgs,
            result:fn(parent,compArgs)
        }
    }


    /** 
     *  Creates binding
     *  markup function 
     */
    function binding(property){
        return new Binding(property);      
    }

    
    

    /**
     * 
     */
  	function _convertToProxyJson(dom, parent, replace,template){

  		var scope = this;
        //any tag other than <include> is processed as html tag 
  		if(	dom.tagName != TAG_INCLUDE &&	dom.tagName != TAG_ELEMENT)
  			return _handle_INLINE_HTML.call(scope, dom, parent, true,template);

  		var	elements = 	doc.select.nodes({childNodes:dom.childNodes},
  				function(node){
  					if(node.nodeType == 1) return node;
  				},
  				function(node){
  					if(node.nodeType == 1) return [];
  					return node.childNodes;
  				}
  		);

  		//if sub elements found process recursivelly
  		if(elements && elements.length > 0){
  			for(var i=0; i< elements.length; i++){
  				var node = elements[i];
  				_convertToProxyJson.call(scope,node, dom, true,template);
  			}
  		}

  		//proces current element
  		if(dom.tagName === TAG_INCLUDE) return _handle_INCLUDE.call(scope,dom, parent, replace,template);
  	}

    /**
     * 
     */
  	function _handle_INCLUDE(node, parent, replace,template){

  		var attributes = _collectAttributes(node).json
  		,	json = '';

  		//empty configuration of the include tag
  		var idx = node.innerHTML.indexOf('{');
  		if( idx < 0){
  			json = 'proxy(scope,{'+ attributes +'})';
  		}

  		else {
  			if(attributes) attributes = attributes + ',';

  			json = 'proxy(scope,{' + attributes +
  			'args: {' +node.innerHTML.substring(idx+1)
  			+'})'
  		}

  		if(replace === true)
  			node.parentNode.replaceChild(document.createTextNode(json),node);

  		return json;
  	}

    
    /**
     * 
     */
    function _handle_INLINE_HTML(node, parent, replace,template){
  		var scope = this
  		,	attributes = _collectAttributes(node);

  		var _type = '__adhoc_component__'+(scope.__sjs_adhoc__++)
  		,	json = ''
        ,   jsonAttr = attributes.json;

  		if(jsonAttr) jsonAttr = ',' + jsonAttr;
  		else jsonAttr = '';

  		if(parent.tagName == 'SJS-ELEMENT')
  			json = 'null, type:\'' + _type + '\'';
  		else
  			json = 'proxy(scope,{type:\''+ _type + '\''+ jsonAttr +'})';

  		if(replace === true)
  			node.parentNode.replaceChild(document.createTextNode(json),node);

  		
  		// build new template and store within scope
  		// run template compiler
        var template = new Template(node,_type,"default").compile(scope);
        var vm = ComponentBase;
        //locate adhoc vm
        if(attributes.values.vm){
            vm = new DataItem(scope).path(attributes.values.vm).getValue();
        }

        scope[_type] = function Component(parent,args){
            var comp = new vm(args);
            comp.parent = parent;
            comp.init(args);
            comp.resolve(parent != null ? parent.scope : null);
            comp.loaded({default:template},scope,args);
            return comp;
        };  

  		return json
  	}


    //todo: add 'style' attribute that will be get to the root of the
    //      component's node to allow inline styling  

    //todo: rename sjs prefix to s
    var reservedAttr = ['sjs-type', 'sjs-content','sjs-vm','sjs-name','sjs-css-class'];
    var reservedAttrPropNames = ['type','content','vm','name','cssClass'];
  	function _collectAttributes(node, filter){
        if(!node) return {};

  		var attributes = node.attributes;
          if(!attributes) return {json:'',value:{}};

  		var result = ''
  		,	separator = ''
        ,   values = {};

  		for(var i=0; i<attributes.length; i++){
  			var attr = attributes[i];
  			var idx = indexOf(reservedAttr,attr.name.toLowerCase());

  			if(idx < 0) continue;

            var name = reservedAttrPropNames[idx];

  			if(startsWith(attr.value,'binding(')){
  				result = result + separator + name + ':' + attr.value;
  				separator = ', ';
  				continue;
  			}
  			result = result + separator + name + ':\'' + attr.value + '\'';
  		    separator = ', ';
            values[name]=attr.value;
  		}
        return {json:result,values:values};
  	};


    /**
     * Array.prototype.indexOf in IE9>
     */
    function indexOf(a,k){
        if(a.indexOf) return a.indexOf(k);
        for(var i=0; i<a.length; i++){
            if(a[i] == k) return i;
        }
        return -1;
    }

    /**
     * 
     */
    function startsWith(s,v){
  		if(s.startsWith) return s.startsWith(v);
  		if(s.indexOf(v) == 0) return true;

  		return false;
  	}

    /**
     * 
     */
  	function capitalize(s){
  		return s[0].toUpperCase() + s.substring(1);
  	}
    

    function searchVisualTree(source, target){
        if(source instanceof Element){
            source = source.htmlElement;
        }

        while(source){
            if(source._obj_ != null && target == null ){
                return source._obj_;
            }

            if(target != null)
            if(source._obj_ instanceof target) {
                return source._obj_;
            }
            source = source.parentNode;
        }
        return null;
    }

    function searchRelationalTree(){
        throw 'not implemented';
    }


    //  Document Application
    //  Uses document.body as a template instance
    var DocumentApplication = Class(function DocumentApplication(){
    }).extend(ComponentBase);

    DocumentApplication.prototype.start =  function(scope){
        this.init();
        var template = new Template(document.body).compile(scope);
        template.clone = function(){return this.node;}
        this.loaded({default:template},scope);
        this.content['default'] = document.body;
        this.display();
    };

    DocumentApplication.prototype.reflow =  function(x,y,w,h,b){
        ComponentBase.prototype.reflow.call(this,x,y,w,h,b);
    };

    return {
        Template:Template,
        ComponentFactory:   ComponentFactory,
        ComponentBase:      ComponentBase,
        DocumentApplication: DocumentApplication,
        proxy:proxy,
        toComponent:toComponent,
        locate:{
            visual: searchVisualTree,
            relational : searchRelationalTree
        },
        logTo:function(lg){log = lg;}
    }

});
