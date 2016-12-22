define([
    'inheritance',
    'event',
    'document',
    'syntax',
    'dataitem',
    'util',
    'preload|component.loader'
],

function(inheritance,events,doc,syntax,data,utils){
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
    ,   mixin = utils.mixin;

  	var BINDING_TYPES = {
  			SELF 		 : 1
  		/* Look for properties within immediate instance */
  		,	PARENT 		 : 2
  		/* Look for properties within direct parent of the immediate instance*/
  		,	FIRST_PARENT : 3
  		/* Look for properties within a first parent  where property if found */
  		,	ROOT 		 : 4
  		/* Look for properties within a root of the parent chain */
  		,	TYPE 		 : 5
  		/* Indicates type lookup lookup */
  	};

    /**
     *  Listens for template loader
     */
    function Listener(){
        events.attach(this,{'onloaded':events.MulticastEvent});
    }

    Listener.prototype.loaded = function(t){	
        if(this.isLoaded) return; //already loaded
        
        //compile templates
        var keys = Object.keys(t);

  		for(var i=0; i< keys.length; i++) {
            if(t[keys[i]].isCompiled) continue;
            t[keys[i]] = new Template(t[keys[i]].node).compile();
  		}
        
        this.t = t;
        this.onloaded(t);
        this.isLoaded = true;
    }

    Listener.prototype.subscribe = function(callback){
        this.onloaded.subscribe(callback);
    }


    /**
     * Component genesis
     */
    function ComponentFactory(require,scope){
        return {define:function(template,controller){
            var parts = template.split(":");
            var listener = new Listener();
            scope[utils.functionName(controller)] = controller;
            require('!'+[parts[1]],function(t){
                listener.loaded(t);
            });
            return function Component(args,parent){
                var comp = new controller(args);
                    comp.parent = parent;
                if(!listener.isLoaded){
                    comp.init(args);
                    comp.resolve(parent != null ? parent.scope : null);
                    listener.subscribe((function(t){
                        this.loaded(t[parts[0]],scope)
                    }).bind(comp));
                } else {
                    // component is created
                    comp.init(args);
                    comp.resolve(parent != null ? parent.scope : null);
                    comp.loaded(listener.t[parts[0]],scope);
                }
                return comp;
            }
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
            document.body.appendChild(child.node);
        }
    };


    /**
     * Base Component
     */
    function ComponentBase(controller){
    }

    //interface callbacks, intended for override
    ComponentBase.prototype.onInit = 
    ComponentBase.prototype.onLoaded = 
    ComponentBase.prototype.onDisplay = 
    ComponentBase.prototype.onResize  = function(){};

    ComponentBase.prototype.loaded = function(template,scope){
        this.isLoaded = true;
        this.scope = scope;
               
        //template instance is created here
        var templateInstance = 
            getTemplateInstance.call(this,template);
        //root node of the component's DOM
        this.node = templateInstance.node;
        //child collection
        this.children = this.children || {};
        this.children = mixin(this.children,templateInstance.children);
        //content map
        this.content = buildContentMap(this.node);
        //notify controller
        this.onLoaded();

        if(this.isDelayedDisplay) this.display(); 
    }


    ComponentBase.prototype.init = function(args){
        this.__init_args__ = args;
        this.onInit(args);
    }


    ComponentBase.prototype.resolve = function(scope){
        if(!scope) return;
        if(!this.__init_args__) return;  
        foreach(this.__init_args__,(function(value,prop){
            if(value instanceof Binding){
                resolveBinding(value,this,prop,scope);
            }
        }).bind(this));
    }


    ComponentBase.prototype.displayChild = function(child){
        //content id = cid
        //content mode  = cmode
        var id = child.contentId || 'default';
        var target = this.content[id];
        var mode = child.contentMode;

        if(mode == 'include'){
            if(id == 'default') throw 'Unable to replace default container';
            target.parentNode.replaceChild(child.node,target);            
            //this.content id;
            return;
        }

        if(mode == 'add'){
            target.appendChild(child.node);
        }

        if(mode == 'replace'){
            //decode the type of child
        }

        if(mode == 'remove'){
            //decode the type of child
        }
        if(child instanceof ComponentBase)                
        child.onDisplay();
    }

    ComponentBase.prototype.display = function(){
        //start display
        var timeStart= window.performance.now();

        //component is displayed already
        if(this.isDisplayed == true) return this;

        //component's templpate is yet to load
        if(!this.isLoaded){
            this.isDelayedDisplay = true;
            return this;
        }

        if(!this.parent) this.parent = DocumentBody;
        this.contentId = this.contentId || 'default';
        this.contentMode = this.contentMode || 'add';

        this.parent.displayChild(this);
        
        
        var parent = this;
        foreach(this.children,function(childList){
            foreach(childList,function(child){
                child.parent = parent;
                child.display();    
            });
        });

        //dislay after node is composed
        //this.parent.displayChild(this);
        
        //display children
        // if(this.children != null) {
        //     for(var i=0; i<this.children.length; i++){
        //         this.children[i].parent = this;
        //         this.children[i].display();
        //     }
        // }

        this.isDelayedDisplay = false;
        this.isDisplayed = true;

        var timeEnd = window.performance.now();

        log.debug(this.constructor.name,timeStart,timeEnd, timeEnd-timeStart);
        return this;
    }
    /**
     * comp - component
     * loc- location
     */
    function initChildCollection(comp,loc){
        comp.children = comp.children || {};
        comp.children[loc] = comp.children[loc] || []; 
    }

    /**
     * Append content child and a content location
     */
    ComponentBase.prototype.add = function(child,location){
        location = location || 'default';
                
        initChildCollection(this,location);

        if(child instanceof ComponentBase){
            this.children[location].push(child);
            child.contentId = location; 
            child.contentMode = 'add';
            child.parent = this;
            if(this.isDisplayed) child.display();
            return;    
        }
        //anything that is not a ComponentBase
        child = {
            node:document.createTextNode(child.toString()),
            contentId:location,
            contentMode:'add',
            display:function(){
                this.parent.displayChild(this);
            }
        };
        
        this.children[location].push(child);

        if(this.isDisplayed) child.display();

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
    ComponentBase.prototype.replace = function(value, location){
        //nothing to do here, if placement is not set
        location = location || 'default';
        
        initChildCollection(this,location);

        var node = this.content[location];
        
        if(value instanceof ComponentBase) {
            node.parentNode.replaceChild(value.node,node);
            this.content[placement] = value.node;
            return;
        }
        
        node.innerHTML = value.toString();
        
    }


    ComponentBase.prototype.resize = function(x,y,width,height,d){

    }


    /** 
     * 
    */
    function Template(node){
        this.node = node;
        this.children = [];
    }

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
  	 */
    Template.prototype.compile = function(){

        var scope = {}
        ,   template = this;

        template.isCompiled = true;

        /* select top level includes */
        var inclusions = [];

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
            ,	parent = node.parentNode
            ,	json = convertToProxyJson.call(scope, node, node.tagName);
                       
            var a = template.addChild(json);
            parent.replaceChild(a,node);
        }

        
        return template;    
    }

    /**
     * 
     */
    function Binding(path,type){
        this.property = path;
        this.type = type;
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
            var child = template.children[i];
            var key = anchors[i].getAttribute('sjs-content');
            var list = children[key];
            if(!list) {
                list = children[key] = [];
            } 
            child = runProxy(this,child);
            child.contentMode = 'include';
            child.contentId = key;
            list.push(child);
        }

        return {
            node:clone,
            anchors:anchors,
            children:children
        };
    }




    /**
     * 
     */
    function buildContentMap(element){
        if(element.tagName == 'TEMPLATE')
            element = element.content;

        var contentNodes = element.querySelectorAll('[sjs-content]')
        ,	cMap = {};

        if(!contentNodes) return;
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
        var _type = new DataItem(component.scope).path(pArgs.type).getValue();
        var instance = null;
        if(_type != null)
            instance = new _type(pArgs.args,component);
        return instance;
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
        return new Binding(property,BINDING_TYPES.TYPE);      
    }

    /**
     * 
     */
  	function resolveBinding(binding, instance, key, scope){
  	    if(!binding) return;
  		//resolveBinding(binding.prev, instance, key, scope);

  		var source = null;
        var sourceInstance = null;
        //target of the binding
        var target = new DataItem(instance).path(key);

  		switch(binding.type){
            case BINDING_TYPES.SELF:
                break;

            case BINDING_TYPES.PARENT:
                if(!instance.parent) throw 'Cannot resolve parent binding, [instance.parent] is null';
                //resolve binding through dataitem
                source = new DataItem(instance.parent).path(binding.prop);
                sourceInstance = instance.parent;
                break;

            case BINDING_TYPES.FIRST_PARENT:
                break;

            case BINDING_TYPES.ROOT:
                break;

            case BINDING_TYPES.TYPE:
                source = new DataItem(instance).path(binding.property);
                break;
  		} //end switch statement

  		if(!source) throw 'Cannot resolve binding source';

        var sourceValue = source.getValue();
        var sourceInstance = source.getOwner();

        var targetValue = target.getValue();
        var targetInstace = target.getOwner();
      /*
        definition: source is a property reference residing in the controller class
      */



      //1. if source is event, subscribe to it
      if(sourceValue && sourceValue.__sjs_event__ === true &&
        typeof(targetValue) == 'function'){
        sourceValue.subscribe(targetValue,instance);
        return;
      }

      //2. if target is event subscribe to it
      if(targetValue && targetValue.__sjs_event__ === true &&
        typeof(sourceValue) == 'function'){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      if(targetValue && targetValue.__sjs_event__ &&
         sourceValue && sourceValue.__sjs_event__ ){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      //3.
      if(typeof(targetValue) == 'function' && typeof(sourceValue) != 'function'){
        source.subscribe(targetValue,instance);
        return;
      }

      //4. value to value binding
      target.setValue(sourceValue);

  	};


    

    /**
     * 
     */
  	function convertToProxyJson(dom, parent, replace){

  		var scope = this;

  		if(	dom.tagName != tags.include &&	dom.tagName != tags.element)
  			return handle_INLINE_HTML.call(scope, dom, parent, true);

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
  				convertToProxyJson.call(scope,node, dom, true);
  			}
  		}

  		//proces current element
  		if(dom.tagName === tags.include) return handle_INCLUDE(dom, parent, replace);
  		if(dom.tagName === tags.element) return handle_ELEMENT(dom, parent, replace);

  	}


  	function handle_INCLUDE(node, parent, replace){

  		var attributes = collectAttributes(node,RESERVED_ATTRIBUTES)
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

  	function handle_ELEMENT(node, parent, replace){
  		var type = node.getAttribute('sjs-type')
  		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);

  		if(attributes) attributes = attributes + ', '

  		var json = 'proxy(scope,{'+
  			attributes +
  			node.innerHTML.substring(node.innerHTML.indexOf('{')+1)
  			+')'

  		if(replace === true)
  			node.parentNode.replaceChild(document.createTextNode(json),node);

  		return json;
  	}


    function handle_INLINE_HTML(node, parent, replace){
  		var scope = this
  		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);

  		var _type = '__inlineTemplate__'+(scope.__sjs_components__.sequence++)
  		,	json = '';

  		if(attributes) attributes = ',' + attributes;
  		else attributes = '';

  		if(parent.tagName == 'SJS-ELEMENT')
  			json = 'null, type:\'' + _type + '\'';
  		else
  			json = 'proxy(scope,{type:\''+ _type + '\''+ attributes +'})';

  		if(replace === true)
  			node.parentNode.replaceChild(document.createTextNode(json),node);

  		/*
  			build new template and store within scope
  			run template compiler
  		*/
  		var sjs_node = document.createElement('sjs-component');

  		sjs_node.appendChild(node);
  		var template = new Template(sjs_node);
  		template.type = _type;


  		if(parent.tagName == 'SJS-ELEMENT'){
  			sjs_node.attributes['sjs-controller'] = 'Controller';
  		}

  		compileTemplate.call(scope, template);

  		return json
  	}



    var RESERVED_ATTRIBUTES = ["type", "name", "singleton", "class", "width", "height", "layout", "controller"];
  	function collectAttributes(node, filter){
  		if(!node) return null;

  		var attributes = node.attributes;
  		if(!attributes) return '';

  		var result = ''
  		,	separator = '';

  		for(var i=0; i<attributes.length; i++){
  			var attr = attributes[i]
  			,	name = propertyName(attr.name,true);

  			if(indexOf(RESERVED_ATTRIBUTES,name) < 0) continue;

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
  		}
  		return result;
  	};

  	/**
  	 *	Converts arbitrary string to a property name
  	 */
  	function propertyName(name, esc){
  		var fn = function(c){
  			if (c== '_') return false;
  			return syntax.Tokenizer.isAlphaNum(c);
  		};

  		var t = syntax.Tokenizer(name,fn);

  		var	result = ''
  		,	token = '';
  		var iscap = false;

  		while(token = t.nextToken()){
  			if(!fn(token) || (token =='sjs' && esc == true)) continue;
  			result = result + (iscap?capitalize(token):token);
  			iscap = true;
  		}
  		return result;
  	}

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
     * Document Application
     * Uses document.body as a template instance
     */
    var DocumentApplication = Class(function DocumentApplication(scope){
        var template = new Template(document.body).compile();
        template.clone = function(){return this.node;}
        this.loaded(template,scope);
        this.content['default'] = document.body;
    }).extend(ComponentBase);

    DocumentApplication.prototype.start =  function(){
        this.display();
    };

    return {
        Template:Template,
        ComponentFactory:   ComponentFactory,
        ComponentBase:      ComponentBase,
        DocumentApplication: DocumentApplication,
        proxy:proxy,
        logTo:function(lg){log = lg;}
    }

});
