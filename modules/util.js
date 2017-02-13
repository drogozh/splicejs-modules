define([
    'exports'
], function(exports){
"use strict";

function fileExt(f){
	return f.substring(f.lastIndexOf('.'));
}

/**
 * 
 * @param {array[string]}  some - optional paramater for property names to copy
 */
function mixin(_t, _s, some, onProperty){
	if(!_s) return _t;
	if(	_s == window || _s == document ||
			_t == window || _t == document
			){
		log.error("Invalid object access " + _s.toString());
		return _t;
	}

    //swap arguments if 'some' is ommited and 'onProperty' is provided
    if(typeof some == 'function'){
        onProperty = some;
        some = null;
    }

	var keys = null;
    if(some){
        keys = some;
    }
    else 
        keys = Object.keys(_s);
	
    for(var key in keys){
		var p = _s[keys[key]];
        if(typeof onProperty == 'function'){
            var transform = onProperty({inst:_t,prop:keys[key]},{inst:_s,prop:keys[key]}); 
             if(transform) {   
                _t[keys[key]] = transform;
            }
        } else {
            _t[keys[key]] = p;
        }
		
	}
	return _t;
}

/**
 * Blends properties of two objects into one
 * in case of duplicate properties 
 * values in the source object win
 */
function blend(target,source,some){
    return mixin(mixin({},target),source,some);
}



function foreach(collection,callback){
    if(!collection) return;
	var	keys = Object.keys(collection)
    ,   idx= 0;
    for(var key in keys ){
        callback(collection[keys[key]],keys[key],idx++);
    }    
}

function max(collection,callback,min){
    if(!collection) return min;
	var	keys = Object.keys(collection)
    ,   idx= 0
    ,   max = -Infinity;
    for(var key in keys ){
        var _x = callback(collection[keys[key]],keys[key],idx++);
        if(_x > max) max = _x;
    }    

    if(max < min) max = min;
    return max;
}

function formany(groups, callback){
    if(!groups) return;
	var	keys = Object.keys(groups);
  
    for(var key in keys ){
        var collection = groups[keys[key]];
        var subkeys = Object.keys(collection)
        ,   idx= 0;
        for(var subkey in keys ){
            callback(collection[subkeys[subkey]],subkeys[subkey],idx++);
        }
        
    }
}




function trim(s){if(!s) return s;
	if(String.prototype.trim) return s.trim();
	return s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

function fname(foo){
	/*
	-- support regular expression only
	because MS Edge browser does not support the name property
	if(foo.name != null) {
		if(foo.name) return foo.name;
		return 'anonymous';
	}
	*/
    if(typeof foo != 'function') throw 'unable to obtain function name, argument is not a function'
    var match = /function(\s*[A-Za-z0-9_\$]*)\(/.exec(foo.toString());
    if(!match)  return 'anonymous';
        var name = trim(match[1]);
        if(!name) return 'anonymous';
        return name;
}


function join(separator, collection, start){
  if(start == null) start = 0;
  if(start > collection.length - 1) return null;
  var result = '', s = '';

  for(var i = start; i < collection.length; i++ ){
    result += (s + collection[i]);
    s = separator;
  }
  return result;
}



function namespaceAdd(path,obj,isSealed){
	if(!path) return this;
	if(this.__sjs_seal__[path]) throw 'namespace ' +path +' is sealed';
	var parts = path.split('.');
	var target = this;
	for(var i=0; i<parts.length-1; i++){
		if(target[parts[i]] == null) target[parts[i]] = Object.create(null);
		target = target[parts[i]];
	}
	if(target[parts[parts.length-1]] != null) throw "namespace conflict: " + path;
	target[parts[parts.length-1]] = obj;

	if(isSealed == true) this.__sjs_seal__[path] = true;
}


function Namespace(){
	if(!(this instanceof Namespace) ) return new Namespace();
	this.sequence = 0;
	this.__sjs_seal__ = {};
	this.children = null;
}

Namespace.prototype = {
	add : function(path, obj, isSealed){
		if(typeof(path)=='object' || typeof(path) == 'function'){
			for(var i=0; i < arguments.length; i++){
				var arg = arguments[i];

				if(typeof arg === 'function' ){
					namespaceAdd.call(this, fname(arg),arg,isSealed);
					continue;
				}

				if(typeof arg == 'object') {
					var keys = Object.keys(arg);
					for(var key in keys){
						namespaceAdd.call(this, keys[key],arg[keys[key]],isSealed);
					}
					continue;
				}
			}
			return this;
		}

		if(typeof(path) == 'string'){
			namespaceAdd.call(this, path,obj,isSealed);
		}
		return this;
	},
	lookup:function(path){
		if(!path) return null;
		var parts = path.split('.');
		var target = this;
		for(var i=0; i<parts.length-1; i++){
			if(target[parts[i]] == null) target[parts[i]] = Object.create(null);
			target = target[parts[i]];
			if(target == null) break;
		}
		return target[parts[parts.length-1]];
	}
};






//logging setup
var log = !window.console ? {} : window.console;
//console log interface
if(!log.error) 	log.error = function(){};
if(!log.debug) 	log.debug = function(){};
if(!log.info) 	log.info  = function(){};
if(!log.warn) 	log.warn = function(){};
if(!log.log) 	log.log = function(){};


return {
    log:log,
    mixin:mixin,
    fname:fname,
    functionName:fname,
    Text:{
        join:join, trim:trim
    },
    ext:fileExt,
    Namespace:Namespace,
    foreach:foreach,
    formany:formany,
    blend:blend,
    max:max,
};

});
