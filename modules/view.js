define([
    'loader',
    { 
        Inheritance : '/{splice.modules}/inheritance',
        Syntax 		: '/{splice.modules}/syntax',
        Document  	: '/{splice.modules}/document',
        Events		: '/{splice.modules}/event'
    }
],function(loader, imports){
 	"use strict";

    var Tokenizer = imports.Syntax.Tokenizer
    , 	Document = imports.Document
    ,  	Class = imports.Inheritance.Class
    ,  	Events = imports.Events
    ;

    var touchSupport = loader.getVar('{touchsupport}');

/**
 * Runs Depth-First-Search on DOM tree 
 */
function dfs(dom, target, filterFn, nodesFn){
    if(!dom) return;

    if(typeof filterFn === 'function') {
        var node = filterFn(dom);
        if(node) target.push(node);
    } else {
        target.push(dom);
    }

    var children = [];
    if(typeof nodesFn === 'function'){
        children = nodesFn(dom);
    }
    else {
        children = dom.childNodes;
    }

    for(var i=0; i < children.length; i++){
        var n = dom.childNodes[i];
        dfs(n,target,filterFn, nodesFn);
    }
}

function selectNodes(dom,filterFn, nodesFn){
    var nodes = new Array();
    dfs(dom,nodes,filterFn, nodesFn);
    if(nodes.length < 1) nodes = null;
    return nodes;
}

function selectTextNodes(dom,filterFn){
    var nodes = new Array();
    //nodeType 3 is a text node
    dfs(dom,nodes,function(node){
        if(node.nodeType === 3) {
        if(typeof filterFn === 'function')	return filterFn(node);
        return node;
        }
        return null;
    });
    if(nodes.length < 1) nodes = null;
    return nodes;
};



function _propertyValueLocator(path){
            var npath = path.split('.')
            ,	result = this;

            //loop over path parts
            for(var i=0; i < npath.length-1; i++ ){
                result = result[npath[i]];
                if(result == null) console.warn('Property ' + path + ' is not found in object ' + result);
            }
            var p = npath[npath.length - 1];
            if(result && result[p] == undefined) console.warn('Property ' + path + ' is not found in object ' + result);

            //hash map object
            return Object.defineProperty(Object.create(null),'value',{
                get:function(){
                    if(!result) return null;
                    return result[p];
                },
                set:function(newValue){
                    if(!result) return;
                    result[p] = newValue;
                }
            });
}

function propertyValue(obj){
    return _propertyValueLocator.bind(obj);
}

function display(view,target){
	target = target || document.body;
	
	if(target instanceof View)
		target = target.htmlElement;
	
	target.appendChild(view.htmlElement);
	view.visualParent = target;
	return view;
}

function remove(view){
	view.visualParent.removeChild(view.htmlElement);
}

display.clear = function(view) {
    if(!view) return {display : display};

    if(view instanceof View ){
        document.body.removeChild(view.htmlElement);
        return {display : display };
    }

    document.body.innerHTML = '';
    return {display : display };

};

function close(controller) {
    controller.concrete.dom.parentNode.removeChild(controller.concrete.dom);
};

function _viewQueryMode(){
    return {
        id:function(id){
            var d = document.getElementById(id);
            if(d) return new View(d);
            return null;
        },
        query:function(query){
            var collection = document.querySelectorAll(query);
            if(!collection) return null;
            return {
                foreach:function(fn){},
                first:function(){
                        return new View(collection[0]);
                }
            }
        }
    }
}


var unitRegex = /^([0-9.]+)([a-zA-Z%]+)$/;
function _unit(value){
    var result = unitRegex.exec(value);
    return {
        value:+result[1],
        unit:result[2]
    }
}    

function _box(element){

    var css = window.getComputedStyle(element,null);

    var w  = css.getPropertyValue('width')
    ,	h  = css.getPropertyValue('height')
    ,	pl = css.getPropertyValue('padding-left')
    ,	pt = css.getPropertyValue('padding-top')
    ,	pr = css.getPropertyValue('padding-right')
    ,	pb = css.getPropertyValue('padding-bottom')
    ,   bl = css.getPropertyValue('border-left-width')
    ,	bt = css.getPropertyValue('border-top-width')
    ,	br = css.getPropertyValue('border-right-width')
    ,	bb = css.getPropertyValue('border-bottom-width')
    ,	ml = css.getPropertyValue('margin-left')
    ,	mt = css.getPropertyValue('margin-top')
    ,	mr = css.getPropertyValue('margin-right')
    ,	mb = css.getPropertyValue('margin-bottom');

    return {
        height:	h,
        width:	w,
        padding: {left:pl, top:pt, right:pr, bottom:pb},
        border:  {left:bl, top:bt, right:br, bottom:bb},
        margin:  {left:ml, top:mt, right:mr, bottom:mb},
        unit:function(){return {
                height:	_unit(h),
                width:	_unit(w),
                padding: {left: _unit(pl), top: _unit(pt), right: _unit(pr), bottom: _unit(pb)},
                border:  {left: _unit(bl), top: _unit(bt), right: _unit(br), bottom: _unit(bb)},
                margin:  {left: _unit(ml), top: _unit(mt), right: _unit(mr), bottom: _unit(mb)}
            }
        }
    }
};



function buildContentMap(element){
    var contentNodes = element.querySelectorAll('[sjs-content]')
    ,	cMap = {};

    if(!contentNodes) return;
    var node = element;
    for(var i=0; i<=contentNodes.length; i++){
        var attr = node.getAttribute('sjs-content');
        if(!attr) {
        node = contentNodes[i];
        continue;
        }
        var keys = attr.split(' ');
        for(var k=0; k<keys.length; k++){
        var key = keys[k];
        if(cMap[key]) throw 'Duplicate content map key ' + key;
        cMap[key] = {source:node, cache:null, n:0};
        }
        node = contentNodes[i];
    }
    return cMap;
};



function domEventArgs(e){
    return {
        mouse: mousePosition(e),
        source: e.srcElement,
        domEvent:e,     // source event
        cancel: function(){
            this.cancelled = true;
            e.__jsj_cancelled = true;
        }
    }
};


function mousePosition(e){
    //http://www.quirksmode.org/js/events_properties.html#position
    var posx = 0
    ,   posy = 0;

    if (e.pageX || e.pageY) 	{
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) 	{
        posx = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop
        + document.documentElement.scrollTop;
    }

    return {x:posx,y:posy};
};



/**
 */
function ViewReflow(){
}

ViewReflow.prototype.simple = function(){
    return this;
}

ViewReflow.prototype.fitparent = function(){
    return this;
}

ViewReflow.prototype.size = function(left, top, width, height){
    var box = _box(this.htmlElement).unit()
    , s = this.htmlElement.style;

    s.width = (width - box.padding.left
                                    - box.padding.right
                                    - box.border.left
                                    - box.border.right) + 'px';
    return this;
}




/**
 *    DomEvent
 */
var DomEvent = Class(function DomMulticastEvent(){
}).extend(Events.BaseEvent);



DomEvent.prototype.attach = function(instance, property){
    if(!Document.isHTMLElement(instance) && !(instance instanceof Element) && !(instance == window))
        throw "Cannot attach DomMulticastEvent target instance if not HTMLElement or not an instance of View ";
    
    var evt = null;
    
    if(this.isMulticast)
        evt = Events.createMulticastRunner();
    else 
        evt = Events.createUnicastRunner();

    var self = this;
    var fn = evt;
    evt = function(e){
        if(!e) e = window.event;
        if(self.stopPropagation) {
            cancelBubble(e);
        }
        
        if(self.stopDefault && e.preventDefault) {
            e.preventDefault();
        }

        setTimeout(function(){
            fn(this.args);
        }.bind({args:_domEventArgs(e)}),1);
    };

    evt.subscribe = function(){
        fn.subscribe.apply(fn,arguments);
    };
    
    evt.unsubscribe = function(){
        fn.unsubscribe.apply(fn,arguments);
    }

    instance[property] = evt;
    if(instance instanceof Element) {
        instance.htmlElement[property] = evt;
    } 
    return evt;
};

var DomMulticastEvent = Class(function DomMulticastEvent(){
	this.base();
    this.isMulticast = true;
}).extend(DomEvent);


var DomUnicastEvent = Class(function UnicastEvent(){
    this.base();
}).extend(DomEvent);


var DomMulticastStopEvent = Class(function DomMulticastStopEvent(){
	this.base();
	this.stopPropagation = true;
    this.isMulticast = true;
}).extend(DomEvent);


var DomUnicastStopEvent = Class(function UnicastStopEvent(){
    this.base();
    this.stopPropagation = true;
}).extend(DomEvent);


/**
 * MouseDown-like even supporting touch interractions
 * */
var UnicastMouseDownEvent = Class(function UnicastMouseDownEvent(isCapture, isStopDefault){
    this.base();
    this.stopPropagation = isCapture;
    this.stopDefault = isStopDefault;

}).extend(DomEvent);

UnicastMouseDownEvent.prototype.attach = function(instance, property) {
    var property = 'onmousedown';
    if(touchSupport === true)
        property = 'ontouchstart';
    return DomEvent.prototype.attach.call(this,instance,property);
};

UnicastMouseDownEvent.prototype.mode = function(mode){
   return new UnicastMouseDownEvent(mode.capture, mode.nodefault);
};




var UnicastClickEvent = Class(function UnicastClickEvent(){
    this.base();
    this.stopPropagation = true;
}).extend(DomEvent);

UnicastClickEvent.prototype.attach = function(instance){
    if(touchSupport !== true)
        return DomEvent.prototype.attach.call(this,instance,'onclick');    
   
    if(instance instanceof Element) instance = instance.node;

    var runner = Events.createUnicastRunner();
    instance.ontouchstart = function(e){
        if(!e) e = window.event;
        cancelBubble(e);
        runner.touchStartTime = new Date().getTime();
    };
    
    instance.ontouchend = function(e){
        if(!e) e = window.event;
        cancelBubble(e);
        var touchEnd = new Date().getTime();
        console.log(touchEnd - runner.touchStartTime);
        if (touchEnd - runner.touchStartTime < 100){
            setTimeout(function(){
                runner(this.args);
            }.bind({args:_domEventArgs(e)}),1);
        }
        runner.touchStartTime = 0;
    };
    return runner;
}

function cancelBubble(e){
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}


function _domEventArgs(e){
    return {
        mouse: mousePosition(e),
        source: e.srcElement,
        domEvent:e,     // source event
        cancel: function(){
                this.cancelled = true;
                e.__jsj_cancelled = true;
            }
    }
}



/**
 *   Dom manipulation api
 */
var Element;
var View = Element = function Element(dom){
    if(!(this instanceof View)){
        return new View(dom);
    }
    if(typeof dom === 'string'){
        this.htmlElement = (function(d){
            var e = document.createElement('span');
            e.innerHTML = d;
            return e.children[0];
        })(dom);
    } else
        this.htmlElement = dom;

    this.node = this.htmlElement;
    _buildClassMap.call(this);

    this._reflowMigrateIgnore = this.node.getAttribute('sjs-reflow-migrate-ignore');
};



Element.prototype.hide = function(){
    this.node.style.display = 'none';
};

Element.prototype.show = function(type){
    this.node.style.display = type || 'inline-block';
};

Element.prototype.remove = function(){
    if(!this.node.parentNode) return;
    this.node.parentNode.removeChild(this.node);
};

Element.prototype.setClass = function(className){
    this.node.className = className;
    _buildClassMap.call(this);
}

Element.prototype.clearClass = function(className){
    this.node.className = '';
}

Element.prototype.removeClass = function(className){
    var idx = this.classMap[className];
    if(idx == null) return;

    this.classStore[idx] = null;
    delete this.classMap[className];
     _commitClassMap.call(this);
    return this;
} 

Element.prototype.swap = function(element){
    var node = this.node;
    
    this.node = element.node;
    this.htmlElement = element.node;
    _buildClassMap.call(this);

    element.node = node;
    element.htmlElement = node;
    _buildClassMap.call(element);
};

Element.prototype.replaceClass = function(oldClass, newClass){
    if(newClass === undefined || newClass === null) {
        newClass = '';
    }
    var idx =  this.classMap[oldClass]
    // undefined or null, dont do anything
    if(idx == null) return; 
    this.classStore[idx] = newClass;
    delete this.classMap[oldClass];
    this.classMap[newClass] = idx;

    _commitClassMap.call(this);
    return this;
};

Element.prototype.appendClass = function(className){
    this.classStore.push(className);
    this.classMap[className] = this.classStore.length - 1;
    _commitClassMap.call(this);
    return this;
};

Element.prototype.addClass = function(name){
    // class map index could 0, check for null
    if(this.classMap[name] != null) return;
    this.appendClass(name);
};

function _buildClassMap(){
    this.classMap = {};
    this.classStore = [];
    var attr = this.node.getAttribute('class');
    if(!attr) return;
    var parts = attr.split(' ');
    for(var i=0; i<parts.length; i++){
        this.classMap[parts[i]] = i;
        this.classStore[i] = parts[i];
    }
}

function _commitClassMap(){
    var result = '', sep = '';
    for(var i=0; i<this.classStore.length; i++){
        if(!this.classStore[i]) continue;
        result = result + sep +  this.classStore[i];
        sep = ' '; 
    }
    this.node.className = result;
    return result;
}



// todo: replace attr call with 
//      attr(name).set()
//      attr(name).get();
View.prototype.attr = function(attr){
    for(var k in attr){
        this.htmlElement.setAttribute(k,attr[k]);
    }
    return this;
};

View.prototype.attrGet = function(attr){
    return this.htmlElement.getAttribute(attr);
};

  View.prototype.style = function(styleString){
  	//var rules = CssTokenizer(styleString);
  	this.htmlElement.setAttribute('style',styleString)
  	return this;
  };

  View.prototype.clear = function(){
  	this.htmlElement.innerHTML = '';
  	return this;
  };

  View.prototype.child = function(name){
  	if(!this.childMap) {
  		this.childMap = Object.create(null);
  		var childViews =this.htmlElement.querySelectorAll('[sjs-view]');
  		for(var i=0; i<childViews.length; i++){
  			var attr = childViews[i].getAttribute('sjs-view');
  			this.childMap[attr] = new View(childViews[i]);
  			this.childMap[attr].parent = this;
  		}
  	}
  	return this.childMap[name];
  };

  View.prototype.controller = function(){
  	return this.htmlElement.__sjs_controller__;
  };

  View.prototype.content = function(content,key){
    return View.addContent.call(this,content,key);
  }


function create(name){
    return new View(document.createElement(name));
}

Element.css = {
    addClass:   function(){throw 'not implemented';},
    removeClass:function(){throw 'not implemented';}
};

Element.DomMulticastEvent       = new DomMulticastEvent();
Element.DomMulticastStopEvent   = new DomMulticastStopEvent();
Element.DomUnicastEvent         = new DomUnicastEvent();
Element.DomUnicastStopEvent     = new DomUnicastStopEvent();
Element.UnicastMouseDownEvent = new UnicastMouseDownEvent();  
Element.UnicastClickEvent = new UnicastClickEvent();  

Element.box = _box;
Element.create = create;
Element.View = Element;

return Element;

});
