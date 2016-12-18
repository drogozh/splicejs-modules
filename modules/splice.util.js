define(['exports'],
function(exports){
"use strict";

function fileExt(f){
	return f.substring(f.lastIndexOf('.'));
}

function mixin(_t, _s){
	if(!_s) return _t;
	var keys = Object.keys(_s);
	if(	_s == window || _s == document ||
			_t == window || _t == document
			){
		log.error("Invalid object access " + _s.toString());
		return _t;
	}
	for(var key in keys){
		var p = _s[keys[key]];
		_t[keys[key]] = p;
	}
	return _t;
}


function foreach(collection,callback){
    var	keys = Object.keys(collection)
    ,   idx= 0;
    for(var key in keys ){
        callback(collection[keys[key]],keys[key],idx++);
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

exports.log = log;
exports.mixin = mixin; 
exports.fname = exports.functionName = fname;
exports.Text = {
    join:join, trim:trim
};

exports.File = {
    ext:fileExt
};

return {Namespace:Namespace,foreach:foreach};

});
