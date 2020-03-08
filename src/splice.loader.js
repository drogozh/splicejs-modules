/*
SpliceJS Loader v.1.0.0

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function(window,document,global){
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

var _handlers = {
    '.js':_handlerWeb
};

function _getWindowOrigin(){
    var path = window.location.pathname;
    return window.origin + "" + path.substr(0,path.lastIndexOf('/'));
}

var _config = (function(){
    if(typeof(process) !== "undefined"){
        _handlers['.js'] = _handlerConsole;
        if(process.cwd().startsWith('/')){
            return {
                origin:process.cwd(),
                pathSeparator:'/',
                platform:'UNX',
            };
        } else {
            return {
                origin:process.cwd(),
                pathSeparator:'\\',
                platform:'WIN',
            };
        }    
    } else {
        return {
            origin:_getWindowOrigin(),
            pathSeparator:'/',
            platform:'WEB'
        };
    }
})();

var _variables = {};
var _queue = [];

var _modules = {
    loader:{status:'imported', exports:{
        setVar:function(v,r){
            _variables[v] = r;
            return this;
        },
        getVar:function(v){
            return _variables[v];
        },
        addHandler:function(ext,handler){_handlers[ext] = handler;},
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

function _getFileExt(url){
    var idx = url.lastIndexOf(".");
    return (idx > -1 && idx > url.lastIndexOf(_config.pathSeparator)) ?  url.substr(idx) : '.js';
}

var _currentScript = [];
_currentScript.top = function top(){
    if(this.length < 1) return null;
    return this[this.length-1];
};

function _getCurrentScript(){
    if(_currentScript.top() != null){
        return _currentScript.top();
    }

    if(_config.platform == 'UNX'){
        return module.parent.filename;
    }

    if(document.currentScript == null){
        return '';
    }
    var path = document.currentScript.src;
    return path;
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
            continue;
        } 
        if(parts[i] == '.') {
            continue;
        }
        stack.push(parts[i]);
    }
    return _join(stack);
}

function _subst(url){
    var keys = Object.keys(_variables);
    var was = url;
    for(var i = 0; i < keys.length; i++) 
	{
		var key = keys[i];
		var value = _variables[key];
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

function _handlerWeb(url,callback){
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

function _handlerConsole(url, callback){
    _currentScript.push(url);
    require(url);
    callback();
    _currentScript.pop(url);
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
        } else {
            m.status = MODULE_STATUS.LOADED;
        }
    });
    return url;
}

function _bindRequire(url){
    return function require(){
        _currentScript.push(url);
        var result = _require.apply({},arguments);
        _currentScript.pop();
        return result;
    }
}

function _traverseDependencies(item, paths, info){
    var deps = {};
    var keys = Object.keys(paths);
    for(var i=0; i<keys.length; i++){
        var path = paths[keys[i]];

        if(path == 'require'){
            deps[keys[i]] = _bindRequire(item.url);
            continue;
        }

        if(path == 'exports'){
            deps[keys[i]] = {};
            if(info != null) {
                info.exportsIndex = keys[i];
            }
            continue;
        }

        if(typeof(path) == 'object'){
            var result = _traverseDependencies(item, path);
            if(result == null) return null;
            deps[keys[i]] = result;
            continue;
        }
        var d = _modules[path];
        if(d == null) return null;

        if(d.dependencies){
            for(var x=0; x<d.dependencies.length; x++){
                if(d.dependencies[x] == item.url) {
                    throw 'SpliceJS Loader Exception: circular dependency. Module ' + path + ' depends on ' + item.url;
                }
            }
        } 

        if(d.status == 'imported') {
            deps[keys[i]] = d.exports;
        } 
        else {
            return null;
        }
    }
    return deps;
}

function _getDependencies(item,info){
    var result = _traverseDependencies(item, item.paths, info);
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
        var info = {};
        var deps = _getDependencies(last,info);
        if(deps == null){
            continue;
        }      
        try {
            _currentScript.push(last.url);
            var exps = last.callback.apply({},deps);
            if(_modules[last.url] != null && _modules[last.url] != ''){
                _modules[last.url].status = MODULE_STATUS.IMPORTED;
                if(info.exportsIndex != null && Object.keys(deps[info.exportsIndex]).length > 0) {
                    _modules[last.url].exports = deps[info.exportsIndex];
                } else {
                    _modules[last.url].exports = exps;
                }
            }
        } catch(e){
            if(_modules[last.url] != null && _modules[last.url] != ''){
                _modules[last.url].status = MODULE_STATUS.FAILED;
                _modules[last.url].exception = e;
            }
            console.error(e);
            throw e;
        } finally {
            _currentScript.pop();
            _queue.splice(i,1);
        }
    }
}

var _isAbsUrl = /^[a-zA-Z]+:\/\//;

function _isSameOrigin(url){
    return url.startsWith(_config.origin);
}

function _resolve(ctx,url){
    url = url.trim();
    // ignore preloads
    if(url.indexOf('preload|') == 0){
        url = url.replace('preload|','');
    }

    // substitute paths
    url = _subst(url);

    // add default module extension
    if(url.indexOf('!') != 0){
        url = url + '.js';
    }    

    url = url.replace('!','');

    if(_isAbsUrl.test(url)){
        return url;
    }
    
    return _config.origin + _collapseUrl(
        _join([ctx.context,url]).split(_config.pathSeparator)
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

var _queueStatus = {interval:null};
function _processQueue(){
    if(_queueStatus.interval != null) return;
        
    var tryQueue = function(){
        try {
        _invokeModules();
        } catch (e){
            clearInterval(_queueStatus.interval);
            throw e;
        }
        if(_queue.length == 0){
            clearInterval(_queueStatus.interval);
            _queueStatus.interval = null;
        }
    }
    _queueStatus.interval = setInterval(tryQueue,1);
}

function _loadDependencies(dep,callback){
    var ctx = _getContext();
    var paths = _resolvePaths(dep,ctx,[]);
    if(_modules[ctx.current] != null && _modules[ctx.current].dependencies == null){
        _modules[ctx.current].dependencies = paths; 
    }
    _queue.push({url:ctx.current, callback:callback, paths: paths});
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
    if(_modules[dep] != null && callback == null){
        return _modules[dep].exports;
    }
    if(_modules[dep] != null && callback != null){
        callback(_modules[dep].exports);
        return;
    }
    _define(dep,callback|| function(){});
}

window.define = global.define = _define;
window.require = _require;

})( typeof(window) === 'undefined' ? {} : window,
    typeof(document) === 'undefined' ? {} : document,
    typeof(global) === 'undefined' ? {} : global);