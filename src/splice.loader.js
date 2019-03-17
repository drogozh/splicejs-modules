(function(window,document){
"use strict"

var ERRORS = {
    HANDLER_NOT_FOUND: function(ext){return 'Handler not found: ' + ext;}
};

var MODULE_STATUS = {
    PENDING:'pending',
    LOADED:'loaded',
    IMPORTED:'imported',
    FAILED:'failed',
};

var _config = {
    origin:window.origin,
    pathSeparator:'/'
};

var _pathVariables = {};

var _handlers = {
    '.js':_handler
};

var _queue = [];

var _modules = {
    loader:{status:'imported', exports:{
        setVar:function(v,r){
            _pathVariables[v] = r;
            return this;
        },
        getVar:function(v){
            return _pathVariables[v];
        },
        addHandler:_addHandler,
        getModules(){
            return _modules;
        },
        list:function(){
            return _modules;
        },
        queue:function(){
            return _queue;
        }
    }},
    require:{status:'imported', exports:_require},
    exports:{status:'imported', exports:{}},
    context:{status: MODULE_STATUS.IMPORTED, exports:{
        resolve:function(url){
            var x =  _resolve(_getContext(),url);
            return x;
        }
    }}
};

function _addHandler(ext, handler){
    _handlers[ext] = handler;
}

function _getFileExt(url){
    var idx = url.lastIndexOf(".");
    return (idx > -1 && idx > url.lastIndexOf(_config.pathSeparator)) ?  url.substr(idx) : '.js';
}

var _currentScript = null;
function _getCurrentScript(){
    if(_currentScript != null){
        return _currentScript;
    }
    if(document.currentScript == null){
        return '';
    }
    var path = document.currentScript.src;
    return path.replace(_config.origin,'');        
}

function _getContext(){
    var current = _getCurrentScript();
    var path = current;
    if(path != null) {
        path = path.substr(0,path.lastIndexOf(_config.pathSeparator));
        path = path.replace(_config.origin,'');
    }
    return {
        context:path,
        current:current
    };
}

function _collapseUrl(parts){
    var stack=[];
    for(var i=0; i<parts.length; i++){
        if(parts[i] == '..'){
            stack.pop();
        } else {
            stack.push(parts[i]);
        }
    }
    return _join(stack);
}

function _subst(url){
    var keys = Object.keys(_pathVariables);
    var was = url;
    for(var i = 0; i < keys.length; i++) 
	{
		var key = keys[i];
		var value = _pathVariables[key];
        url = url.replace(key, value);
	}
	return url;
}

function _join(parts){
    var s = '',url='';
    for(var i=0; i<parts.length; i++){
        if(parts[i].startsWith(_config.pathSeparator)){
            url = parts[i];    
        } else {
            url += s + parts[i];
        }
        s = _config.pathSeparator;
    }
    return url;
}

function _handler(url,callback){
    var head = document.head || document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("async","");
    script.setAttribute("src", url);
    script.onload = function(){
        script.onload = null;
        callback();
    }
    head.appendChild(script);
}

function _load(url){
    var ext = _getFileExt(url);
    if(_handlers[ext] == null){
        throw ERRORS.HANDLER_NOT_FOUND(ext);
    }
   
    if(_modules[url] != null){ 
        return _modules[url]
    };
    var m = _modules[url] = {status:MODULE_STATUS.PENDING};
    _handlers[ext](url, function(exp){
        if(exp != null) {
            m.exports = exp;
            m.status = MODULE_STATUS.IMPORTED;
        }
    });
    return url;
}

function _traverseDependencies(paths){
    var deps = {};
    var keys = Object.keys(paths);
    for(var i=0; i<keys.length; i++){
        var path = paths[keys[i]];
        if(typeof(path) == 'object'){
            var result = _traverseDependencies(path);
            if(result == null) return null;
            deps[keys[i]] = result;
            continue;
        }
        var d = _modules[path];
        if(d == null) return null;
        if(d.status == 'imported') {
            deps[keys[i]] = d.exports;
        } else {
            return null;
        }
    }
    return deps;
}

function _getDependencies(paths){
    var result = _traverseDependencies(paths);
    if(result == null){
        return null;
    }
    var deps = [];
    var keys = Object.keys(result);
    for(var i=0; i<keys.length;i++){
        deps.push(result[keys[i]]);
    }
    return deps;
}

function _invokeModules(){
    var i = _queue.length;
    while(i-- > 0 ){
        var last = _queue[i];
        var deps = _getDependencies(last.paths);
        if(deps == null){
            continue;
        }
        _currentScript = last.url;

        try {
            var exps = last.callback.apply({},deps);
            if(_modules[last.url] != null && _modules[last.url] != ''){
                _modules[last.url].status = MODULE_STATUS.IMPORTED;
                _modules[last.url].exports = exps;
            }
        } catch(e){
            if(_modules[last.url] != null && _modules[last.url] != ''){
                _modules[last.url].status = MODULE_STATUS.FAILED;
            }
            throw e;
        } finally {
            _currentScript = null;
            _queue.splice(i,1);
        }
    }
}

function _resolve(ctx,url){
    url = url.trim();
    // ignore preloads
    if(url.indexOf('preload|') == 0){
        url = url.replace('preload|','');
    }

    // add default module extension
    if(url.indexOf('!') != 0){
        url = url + '.js';
    }    

    url = url.replace('!','');
    return _collapseUrl(
        _join([ctx.context,_subst(url)]).split(_config.pathSeparator)
    );        
}

function _resolvePaths(dep, ctx, paths){
    var keys = Object.keys(dep);
    for(var i=0; i<keys.length; i++){
        var d = dep[keys[i]];
        if(d == 'require' || d == 'loader' || d == 'exports' || d == 'context') { 
            paths[keys[i]] = d;
            continue;
        } 

        if(typeof(d) == 'object'){
            paths[keys[i]] = {};
            _resolvePaths(d,ctx,paths[keys[i]]);
            continue;
        }

        var path = _resolve(ctx,d);
        paths[keys[i]] = path;
        _load(path);
    }
    return paths;
}

var _queueStatus = {busy:false};
function _processQueue(){
    if(_queueStatus.busy) return;
    _queueStatus.busy = true;
    var foo = function(){
        _invokeModules();
        if(_queue.length > 0){
            setTimeout(foo,2);
        } else {
            _queueStatus.busy = false;
        }
    }
    foo();
}

function _loadDependencies(dep,callback){
    var ctx = _getContext()
    _queue.push({url:ctx.current, callback:callback, paths:_resolvePaths(dep,ctx,{})});
    _processQueue();
}

function _define(dep,callback){
    if(Array.isArray(dep)){
        _loadDependencies(dep,callback);
        return;
    } else if (typeof(dep) == 'function'){
        _loadDependencies([],dep);
    }
    else {
        _loadDependencies([dep],callback);
        return;
    }
}

function _require(dep,callback){    
    if(_modules[dep] != null){
        return _modules[dep].exports;
    }
    _define(dep,callback|| function(){});
}

window.define = _define;
window.require = _require;

})(window,document);