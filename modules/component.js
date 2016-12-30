define([
    'inheritance',
    'event',
    'document',
    'syntax',
    'dataitem',
    'util',
    'animation',
    'view',
    'preload|component.loader'
],

function(inheritance,events,doc,syntax,data,utils,effects,view){
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
    ,   Animation = effects.Animation;


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
        ,   PATH        :  6
  	};

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
        if(this.isLoaded) return; //already loaded
        
        //compile templates
        var keys = Object.keys(t);

  		for(var i=0; i< keys.length; i++) {
            if(t[keys[i]].isCompiled) continue;
            t[keys[i]] = new Template(t[keys[i]].node,keys[i]).compile(scope);
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
        return {define:function(template,controller,defaultArgs){
            var parts = template.split(":");
            var listener = new Listener();
            scope[utils.functionName(controller)] = controller;
            require('!'+[parts[1]],function(t){
                listener.loaded(t,scope);
            });
            return function Component(args,parent){
                args = utils.blend(defaultArgs,args);
                var comp = new controller(args,parent);
                    comp.parent = parent;
                    comp.__templatename__ = parts[0]; 
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
    ComponentBase.prototype.onResize  = function(){};

    ComponentBase.prototype.loaded = function(template,scope){
        this.isLoaded = true;
        this.scope = scope;
        this.content = {};
        this.contentOverride = {};

        //template instance is created here
        var templateInstance = 
            getTemplateInstance.call(this,template);
        //root node of the component's DOM
        this.node = templateInstance.node;
        //child collection
        this.children = this.children || {};
        this.children = mixin(this.children,templateInstance.children);
        //content map
        buildContentMap.call(this);
        //notify controller
        this.onLoaded();

        if(this.isDelayedDisplay) this.display(); 
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


    ComponentBase.prototype.resolve = function(scope){
        if(!scope) return;
        if(!this.__init_args__) return;  
        foreach(this.__init_args__,(function(value,prop){
            if(value instanceof Binding){
                resolveBinding(value,this,prop,scope);
            }
        }).bind(this));
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
        var mode = child.contentMode;

        var animation = isAnimation.call(child);
        
        
        if(mode == 'include'){
            target = this.content[child.includeId];
            target.parentNode.replaceChild(child.node,target);            
            //this.content id;
            //return;
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

        //child is a proxy object
        if(child.__sjs_isproxy__ === true){
            child = child(this);
        }


        if(!(child instanceof ComponentBase))
            child = new ValueComponent(child.toString());

        this.children[location].push(child);
        child.contentId = location; 
        child.contentMode = 'add';
        child.parent = this;

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
    ComponentBase.prototype.replace = function(child, location){
        //nothing to do here, if placement is not set
        location = location || 'default';
        
        var target = this.contentOverride[location] || this.content[location];
        if(target instanceof ComponentBase){
            target.replace(child);
            return;
        }

        initChildCollection(this,location);

        var current = this.children[location];

        //child is a proxy object
        if(child.__sjs_isproxy__ === true){
            child = child(this);
        }


        if(current instanceof ValueComponent) {
            //child = new ValueComponent(child.toString());
            current.setValue(child.toString());
            return;
        } //else

        if(!(child instanceof ComponentBase))
            child = new ValueComponent(child.toString());

        this.children[location] = [child];                
        child.contentMode = 'replace';
        child.contentId = location;
        child.parent = this;


        if(this.isDisplayed) child.display();

        //highjack content
        if(child instanceof ComponentBase && child.__content__ != null){
            this.contentOverride[child.__content__] = child;
        }
    }


    ComponentBase.prototype.reflow = function(x,y,w,h,d){
        if(!this.node) return;

        var style = this.node.style;
        if(x != null)
            style.left = x + 'px';
        if(y != null)
            style.top = y + 'px';
        

        var box = view.box(this.node).unit();

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
        utils.formany(this.children,function(child){
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

    ValueComponent.prototype.setValue = function(value){
        this.node.value = value.toString();
    }

    /** 
     * 
     */
    function Template(node,name){
        this.node = node;
        this.name = name;
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
    function Binding(path,kind){
        this.property = path;
        this.kind = kind;
        this.targetType = null;
    }

    Binding.prototype.parent = function(typeName){
        this.targetType = typeName;
        this.kind = BINDING_TYPES.PARENT;
        return this;
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
            var list = children[key];
            if(!list) {
                list = children[key] = [];
            } 
            var child = runProxy(this,json)(this);
            child.contentMode = 'include';
            child.includeId = key;
            list.push(child);

            //set child as content receiver
            if(child.__content__){
                this.content[child.__content__] = child;
            }
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
            instance.__content__ = pArgs.content;     
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
        return new Binding(property,BINDING_TYPES.PATH);      
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

  		switch(binding.kind){
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
                break;
            case BINDING_TYPES.PATH:
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
  		if(dom.tagName === tags.element) return handle_ELEMENT.call(scope,dom, parent, replace,template);

  	}

    /**
     * 
     */
  	function handle_INCLUDE(node, parent, replace,template){

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

    
    /**
     * 
     */
    function handle_ELEMENT(node, parent, replace,template){
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

    /**
     * 
     */
    function handle_INLINE_HTML(node, parent, replace,template){
  		var scope = this
  		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);

  		var _type = '__adhoc_component__'+(scope.__sjs_adhoc__++)
  		,	json = '';

  		if(attributes) attributes = ',' + attributes;
  		else attributes = '';

  		if(parent.tagName == 'SJS-ELEMENT')
  			json = 'null, type:\'' + _type + '\'';
  		else
  			json = 'proxy(scope,{type:\''+ _type + '\''+ attributes +'})';

  		if(replace === true)
  			node.parentNode.replaceChild(document.createTextNode(json),node);

  		
  		// build new template and store within scope
  		// run template compiler
          var template = new Template(node).compile(scope);

  		// if(parent.tagName == 'SJS-ELEMENT'){
  		// 	sjs_node.attributes['sjs-controller'] = 'Controller';
  		// }

  		

        scope[_type] = function Component(args,parent){
            var comp = new ComponentBase(args);
            comp.parent = parent;
            comp.init(args);
            comp.resolve(parent != null ? parent.scope : null);
            comp.loaded(template,scope);
            return comp;
        };  

  		return json
  	}



    var RESERVED_ATTRIBUTES = ["type", "name", "singleton", "class", "width", "height", "layout", "controller","content"];
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
        var template = new Template(document.body).compile(scope);
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
