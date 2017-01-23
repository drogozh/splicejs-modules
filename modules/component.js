define([
    'inheritance',
    'event',
    'document',
    'dataitem',
    'util',
    'animation',
    'view',
    'binding',
    'preload|component.loader'
],
//todo: Component mode supports data-driven component selection
//requires unicast event hander to return a value
function(inheritance,events,doc,data,utils,effects,Element,_binding){
    "use strict";

    var tags = {
        include:'INCLUDE',
        template:'TEMPLATE',
        element:'ELEMENT'
    }

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
        events.attach(this,{'onloaded':events.MulticastEvent});
    }

    /**
     * @param scope - scope object passed to a component factory
     */
    Listener.prototype.loaded = function(t,scope){	
        if(this.isLoaded) { 
            console.log('already loaded');
            return; 
        }//already loaded
        
        //compile templates
        var keys = Object.keys(t);

  		for(var i=0; i< keys.length; i++) {
            if(t[keys[i]].isCompiled) continue;
            t[keys[i]] = new Template(t[keys[i]].node,keys[i]).compile(scope);
  		}
        
        this.t = t;
        this.isLoaded = true;
        this.onloaded(t);
       
    }

    Listener.prototype.subscribe = function(callback){
        this.onloaded.subscribe(callback);
    }


    /**
     * Component genesis
     */
    function ComponentFactory(require,scope){
        return {define:function(template,controller,defaultArgs,p){
            var parts = template.split(":");
            var listener = new Listener();
            listener.p = p;
            scope[utils.functionName(controller)] = controller;
            require('!'+[parts[1]],function(t){
                listener.loaded(t,scope);
            });
            var componentConstructor = function Component(args,parent){
                args = utils.blend(defaultArgs,args);
                var comp = new controller(args,parent);
                    comp.parent = parent;
                    comp.__name__ = parts[0]; 
                    comp.init(args);
                    comp.onResolve();
                    comp.resolve(args,parent);
                   
                if(!listener.isLoaded){
                   listener.subscribe((function(t){
                        this.loaded(t[parts[0]],scope)
                    }).bind(comp));
                } else {
                    // component is created
                    comp.loaded(listener.t[parts[0]],scope);
                }
                return comp;
            }
            //this will allow extending components
            componentConstructor.prototype = controller.prototype;
            return componentConstructor;
        }
    }
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
            
            if(animation) animation.animate();

            child.onDisplay();
        }
    };


    /**
     * Base Component
     */
    function ComponentBase(){
    }

    //interface callbacks, intended for override
    ComponentBase.prototype.onInit = 
    ComponentBase.prototype.onLoaded = 
    ComponentBase.prototype.onDisplay =
    ComponentBase.prototype.onResolve =  
    ComponentBase.prototype.onChildChanged =
    ComponentBase.prototype.onChildDisplay =
    ComponentBase.prototype.onResize  = function(){};

    ComponentBase.prototype.loaded = function(template,scope){
        
        if(this.__init_args__ && this.__init_args__.fuckbox){
            console.log(this.includeId);
        }
        this.isLoaded = true;
        this.scope = scope;
        this.content = {};
        this.override = {};

        //template instance is created here
        var templateInstance = 
            getTemplateInstance.call(this,template);
        //root node of the component's DOM
        this.node = templateInstance.node;
        this.node.__obj = this;

        //child collection
        //todo: this property should be turned into 'private' 
        //otherwise it could unintentionally overwritten
        //causing strange and hard to debug behaviour
        this.children = this.children || [];

        //construc element map
        buildElementMap.call(this);

        //1. content map
        buildContentMap.call(this);

        //2. process included components and 
        //   all includes must be derived from ComponentBase
        //   check for any content overrides
        //   includes are special types of children and processed separately from any other content child
        //   this is because they are a part of template composition
        //todo: rename includes to components
        this.includes = templateInstance.children;
        this._components = {};
        var keys = Object.keys(this.includes);
        for(var key in keys){
            var c = this.includes[keys[key]].__parent_content__;
            if(this.includes[keys[key]].__include_name__){
                this._components[this.includes[keys[key]].__include_name__] = 
                    this.includes[keys[key]];
            }
            if(!c) continue;
            this.content[c] = this.includes[keys[key]];             
        }

        //3. process 'content' argument 
        if(this.__init_args__ && this.__init_args__.content){
            processCompositionContent.call(this,this.__init_args__.content);
        }
       

        //notify controller
        this.onLoaded();

        //process replacement queue
        //todo: review off-screen state tracking
        var _x = null;
        while(this.toReplace && (_x = this.toReplace.shift()) ) {
            this.set(_x.child,_x.location);
        }
        if(this.isDelayedDisplay) this.display(); 
    }
    // typeof the content
    // 1. proxy
    // 2. value type
    // 3. component instance
    // 4. content key value object
    function processCompositionContent(content){
        content = toComponent(content);
        content._parent = this;  //visual parent  

        //content is proxy
        // if(content.__sjs_isproxy__){
        //     content = content(this);
        //     content._parent = this;  //visual parent  
        // }
        if(content.__parent_content__){
            var cnt = content.__parent_content__;
            this.override[cnt] = this.content[cnt];
            this.content[cnt] = content;
            content.__sjs_useoverride__ = true;
            this.set(content,cnt);    
            console.log('user content');    
            return;
        }
        this.set(content);

        // if(content instanceof ComponentBase){
        //     var cnt = content.__parent_content__;
        //     content._parent = this; //visual parent    
        //     if(!cnt) return;
            
        //     this.override[cnt] = this.content[cnt];
        //     this.content[cnt] = content;
        //     content.__sjs_useoverride__ = true;
        //     this.set(content,cnt);    
        //     console.log('user content');    
        // }
    }

    ComponentBase.prototype.init = function(args){
        this.__init_args__ = args;
        
        //default layout mode
        this.layout = 'css';
        
        //read out arguments
        if(args){
            this.animated =args.animated;
            this.layout = args.layout || this.layout; 
        }
        this.onInit(args);
    }


    ComponentBase.prototype.resolve = function(args,parent){
        if(!parent) return;
        var scope = parent.scope;
        if(!args) return;  
        foreach(args,(function(value,prop){
            if(value instanceof Binding){
                Binding.resolveBinding(value,this,prop,scope);
            }
        }).bind(this));
    }
    
    ComponentBase.prototype.getComponent = function(name){
        if(!this._components) return null;
        return this._components[name];
    }

    ComponentBase.prototype.getElement = function(name){
        if(!(this.elements && this.elements[name])) return null;
        if(this.elements[name] instanceof Element ) 
            return this.elements[name];
        return this.elements[name] = Element(this.elements[name]);
    }

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

  

    ComponentBase.prototype.displayChild = function(child){
        //content id = cid
        //content mode  = cmode
        var id = child.contentId || 'default';
        var target = this.content[id];
        if(child.__sjs_useoverride__)
            target = this.override[id];

        var mode = child.contentMode;

        var animation = isAnimation.call(child);
        
        //contentid is not relevant on includes
        //includeId is relevant
        if(mode == 'include'){
            target = this.content[child.includeId];
            // this here means that include child is no londer required
            if(!target.parentNode){
                //delete all the references of the include is
                delete this.content[child.includeId]; 
                return;
            }
            target.parentNode.replaceChild(child.node,target);            
        }

        if(!target) {
            console.warn('Content target for ' + id + ' is not found, content is not rendered');
            return;
        }

        if(mode == 'add'){
            target.appendChild(child.node);
        }

        if(mode == 'replace'){
            target.innerHTML = '';
            target.appendChild(child.node);
        }

        if(mode == 'remove'){
            //decode the type of child
        }

        if(animation != null) animation.animate();

        // if(child instanceof ComponentBase)                
        //     child.onDisplay();

    }

    ComponentBase.prototype.detachChild = function(child){
        child.node.parentNode.removeChild(child.node);
    }


    ComponentBase.prototype.detach = function(){
        if(!this._parent) throw 'Unable to detach orphaned component';
        this.parent.detachChild(this);
    }

    ComponentBase.prototype.display = function(parent){
        //start display
        var timeStart= window.performance.now();

        //component is displayed already
        if(this.isDisplayed == true) return this;

        //component's templpate is yet to load
        if(!this.isLoaded){
            this.isDelayedDisplay = true;
            return this;
        }

        if(!this._parent) this._parent = DocumentBody;
        this.contentId = this.contentId || 'default';
        this.contentMode = this.contentMode || 'add';

        this._parent.displayChild(this);
        
        
        var keys = Object.keys(this.includes);
        for(var key in keys){
            this.includes[keys[key]].display()._parent = this;
        }

        
        foreach(this.children,(function(child){
            child._parent = this;
            child.display(this);
            this.onChildDisplay(child);     
        }).bind(this));


        this.isDelayedDisplay = false;
        this.isDisplayed = true;

        var timeEnd = window.performance.now();

        log.debug(this.constructor.name,timeStart,timeEnd, timeEnd-timeStart);
        this.onDisplay();
        return this;
    }
       

    /**
     * Append content child and a content location
     */
    ComponentBase.prototype.add = function(child,location){
        location = location || 'default';

        child = toComponent(child,this);

        this.children = this.children || [];    
        this.children.push(child);
        child.contentId = location; 
        child.contentMode = 'add';
        child.parent = this;
        child._parent = this;

        if(this.isDisplayed) {
            child.display(this);
            this.onChildDisplay(child);
        }
       
        return child;
    }

    
    /**
     * Remove content child at location
     * if content location contains only a single child then
     * child parameter could be blank
     */
    ComponentBase.prototype.remove = function(child,location){

    }

    
    /**
     * Replaces content at provided location
     */
    ComponentBase.prototype.set = function(child, location){
        //queue replacement if component is not loaded yet
        if(!this.isLoaded ) {
            this.toReplace = this.toReplace || [];
            this.toReplace.push({child:child, location:location});
            return child;
        }
        //nothing to do here, if placement is not set
        location = location || 'default';
        
        //we could be dealing with an object that is yet to be loaded
        var target = this.content != null ? this.content[location] : null;
        if(child.__sjs_useoverride__)
            target = this.override[location];


        if(target instanceof ComponentBase){
            target.set(child);
            return null;
        }
        

        //child is a proxy object
        if(child.__sjs_isproxy__ === true){
            child = child(this);
        }

        if(target instanceof ValueComponent) {
             target.setValue(child.toString());
            return null;
        } //else

        if(!(child instanceof ComponentBase) && 
            !(child instanceof ValueComponent))
            child = new ValueComponent(child.toString());
        
        this.children = this.children || [];  
        this.children.push(child);                
        child.contentMode = 'replace';
        child.contentId = location;
        child.parent = this;
        child._parent = this;

        if(this.isDisplayed) { 
            child.display(this);
            this.onChildDisplay(child);
        }
        return this;
    }

    ComponentBase.prototype.applyContent = function(content){
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
        if(typeof s === 'function' && s.__sjs_isproxy__ === true ){
            return s(parent);
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

    ComponentBase.prototype.reflow = function(x,y,w,h,d){
        if(!this.node) return;

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

        //reflow children
        foreach(this.children,function(child){
            if(child instanceof ComponentBase &&  child.layout == "container"){
                child.reflow(null,null,w,h);
            }    
        });

    }


    /**
     * 
     */
    function ValueComponent(value){
        this.node = document.createTextNode(value);
    }

    //do nothing on display
    ValueComponent.prototype.display = function(){
        if(!this.parent) return;
        this.parent.displayChild(this);
    }; 


    ValueComponent.prototype.set = function(value){
        this.node.value = value.toString();
    };
    //override toString
    ValueComponent.prototype.toString = function(){
        return this.node.value.toString();
    }

    //todo: how about tryng string-based template components
    //to utilize innerHTML behavior for complex data controls

    /** 
     *  Template
     */
    function Template(node,name){
        this.node = node;
        if(node.tagName == tags.include) {
            this.node = document.createElement('span');
            this.node.appendChild(node);    
        }

        this.name = name;
        this.children = [];
    }
    //todo: figure out how to deal with top level <include> tags in the template
    Template.prototype.addChild = function(child){
  	    this.children.push(child);
  		var childId =  this.children.length-1;
  		var a = document.createElement('a');
  		a.setAttribute('sjs-child-id',	childId);
        a.setAttribute('sjs-content','child'+childId);
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
        var nodes = doc.select.nodes({childNodes:template.node.childNodes},
                function(node){
                    if(node.tagName == tags.include || node.tagName == tags.element) return node;
                },
                function(node){
                    if(node.tagName == tags.include || node.tagName == tags.element) return [];
                    return node.childNodes;
                }
            );

        if(!nodes || nodes.length < 1) return template;

        for(var i=0; i<nodes.length; i++){
            var node = nodes[i]
            ,	parent = node.parentNode;
            
            var	json = convertToProxyJson.call(scope, node, node.tagName,false,this);
            
            //create placeholder anchor           
            var a = template.addChild(json);
            
            //replace current node with a placeholder anchor
            parent.replaceChild(a,node);
        }

        
        return template;    
    }




    /** 
     * 
    */
    function getTemplateInstance(template){
        var clone = template.clone()
        ,   _anchors = clone.querySelectorAll('[sjs-child-id]')
        ,   anchors = [];

        for(var i=0; i<_anchors.length; i++){
            var a = _anchors[i];
            var id = a.getAttribute('sjs-child-id');
            anchors[id] = a;
        }

        var children = {};
        for(var i=0; i < template.children.length; i++){
            var json = template.children[i];
            var key = anchors[i].getAttribute('sjs-content');
             
            var child = runProxy(this,json)(this);
            child.contentMode = 'include';
            child.includeId = key;
            child._parent = this; //visual parent
            children[key]= child;
        }

        return {
            node:clone,
            anchors:anchors,
            children:children
        };
    }

    function buildElementMap(){
        var element = this.node;
        var elementNodes = element.querySelectorAll('[sjs-element]');
        
        var elementMap = this.elements = {};
        var node = element;
        for(var i=-1; i <elementNodes.length; i++){
            if(i>-1)  node = elementNodes[i];

            var attr = node.getAttribute('sjs-element');
            if(!attr) continue;
            var keys = attr.split(' ');
            for(var k=0; k<keys.length; k++){
                var key = keys[k];
                if(elementMap[key]) throw 'Duplicate name map key ' + key;
                
                elementMap[key] = node;
            }
            
        }
        return elementMap;
    }


    /**
     * 
     */
    function buildContentMap(){

        var element = this.node;

        if(element.tagName == 'TEMPLATE')
            element = element.content;

        var contentNodes = element.querySelectorAll('[sjs-content]')
        ,	cMap = this.content;

        if(!contentNodes || contentNodes.length < 1) {
            return cMap['default'] = element;
        }
        var node = element;
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
                cMap[key] = node;
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
    function proxy(component,pArgs){
        var prx =  function proxy(parent){
            var _type = new DataItem(component.scope).path(pArgs.type).getValue();
            var instance = null;
            if(_type != null) {
                instance = new _type(pArgs.args,parent);
            }
            if(instance == null) {
                throw 'type not found [' + pArgs.type +']';
            }

            instance.__parent_content__ = pArgs.parentContent;
            if(pArgs.__sjs_name__)
                instance.__include_name__ = pArgs.__sjs_name__;     
            return instance;
        }

        prx.__sjs_isproxy__ = true;
        return prx;
    }


    /**
     * 
     * 
     */
    function runProxy(component,json){
        var	fn = new Function(
            "var proxy = arguments[0][0]; "      +
            "var scope = this;"+
            "var binding = arguments[0][1];" +
            "var window = null; var document = null; return " + json);
        return fn.call(component,[proxy,binding]);
    }


    /** 
     *  Creates binding
     *  markup function 
     * 
     */
    function binding(property){
        return new Binding(property);      
    }

    
    

    /**
     * 
     */
  	function convertToProxyJson(dom, parent, replace,template){

  		var scope = this;
        //any tag other than <include> or <element> is processed as html tag 
  		if(	dom.tagName != tags.include &&	dom.tagName != tags.element)
  			return handle_INLINE_HTML.call(scope, dom, parent, true,template);

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
  				convertToProxyJson.call(scope,node, dom, true,template);
  			}
  		}

  		//proces current element
  		if(dom.tagName === tags.include) return handle_INCLUDE.call(scope,dom, parent, replace,template);
  	}

    /**
     * 
     */
  	function handle_INCLUDE(node, parent, replace,template){

  		var attributes = collectAttributes(node).json
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
    function handle_INLINE_HTML(node, parent, replace,template){
  		var scope = this
  		,	attributes = collectAttributes(node);

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
        var template = new Template(node).compile(scope);
        var vm = ComponentBase;
        //locate adhoc vm
        if(attributes.values.vm){
            vm = new DataItem(scope).path(attributes.values.vm).getValue();
        }

        scope[_type] = function Component(args,parent){
            var comp = new vm(args);
            comp.parent = parent;
            comp.init(args);
            comp.resolve(parent != null ? parent.scope : null);
            comp.loaded(template,scope);
            return comp;
        };  

  		return json
  	}


    //todo: add 'style' attribute that will be get to the root of the
    //      component's node to allow inline styling  

    //todo: add sjs-name attribute for named includes
    var reservedAttr = ['sjs-type', 'sjs-content','sjs-override','sjs-vm','sjs-name'];
    var reservedAttrPropNames = ['type','content','parentContent','vm','name'];
  	function collectAttributes(node, filter){
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

  			if(name == 'name') {
  				name = '__sjs_name__';
  			}
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
    
    /**
     * 
     */
    function locateComponent(start,type){
        //look in the component chain
        if(start instanceof ComponentBase) {
            var parent = start;
            while(parent){
                if(parent instanceof type) return parent;
                parent = parent.parent;
            }
            return null;
        }

        //look in the dom tree
        var parent = null;
        if(start instanceof Element){
            parent = start.__obj;  
        }
            parent = start;
         
        while(parent){
            if(parent.__obj instanceof type) return parent.__obj;
            parent = parent.parentNode;
        }
        return null;

    }


    /**
     * 
     * Document Application
     * Uses document.body as a template instance
     */
    var DocumentApplication = Class(function DocumentApplication(){
    }).extend(ComponentBase);

    DocumentApplication.prototype.start =  function(scope){
        var template = new Template(document.body).compile(scope);
        template.clone = function(){return this.node;}
        this.loaded(template,scope);
        this.content['default'] = document.body;
        this.display();
    };

    return {
        Template:Template,
        ComponentFactory:   ComponentFactory,
        ComponentBase:      ComponentBase,
        DocumentApplication: DocumentApplication,
        proxy:proxy,
        toComponent:toComponent,
        locate:locateComponent,
        logTo:function(lg){log = lg;}
    }

});
