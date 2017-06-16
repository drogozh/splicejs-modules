define([
    'loader'
],function(loader){
  "use strict";

    var context = loader.context;

    // constants map for request types
    var REQUEST_TYPES = {
        FORM: 1,
        TEXT: 2,
        JSON: 3
    };

    var READY_STATES = {
        UNSENT:0,
        OPENED:1,
        HEADERS_RECEIVED:2,
        LOADING:3,
        DONE:4
    };

    // used to time and recognize request failure
    var REQUEST_TIMEOUT = 5000;

    var HttpRequest = function HttpRequest(request){
        this.transport =  new XMLHttpRequest();

        // setup onload handler
        this.transport.onload = (function(){
            if(this._requestTimeOut && this._requestTimeOut.isTimeOut) return;
            _handleStateChange.call(this,this._observer,function(r){return r;});
        }).bind(this);
            
        
        this._url = request.url;

        // setup request object
        this._headers = _setTypeHeaders.call(this, request);

        // prepare data based on request type
        this._data = _prepareData.call(this, request);
	};

    HttpRequest.prototype.stop = function(){
        this.transport.abort();
    }

    function _send(url, observer,verb){
        this._observer = observer;
        this._requestTimeOut = {};
        
        if(verb == 'GET' && this._data){
            if(/\?/.test(url)) {
                url = url + '&' + this._data;    
            } else {
                url = url + '?' + this._data;
            } 
        }

        //start request
        this.transport.open(verb, url);

        // apply request headers
        var keys = Object.keys(this._headers);
        for(var i=0; i<keys.length; i++){
            this.transport.setRequestHeader(keys[i],this._headers[keys[i]]);
        }

        if(verb == 'POST')
            this.transport.send(this._data);
        else 
            this.transport.send();    

        this._requestTimeOut.timerId = setTimeout((function(){
            this._requestTimeOut.isTimeOut = true;
            if(typeof observer.fail === 'function'){
                observer.fail({code:-1});
            }
            if(typeof observer.complete === 'function'){
                observer.complete();
            }
        }).bind(this), REQUEST_TIMEOUT);   
        return this;
    }


    function _prepareData(request){
        if(!request.data) return;
        switch(request.type) {
            case REQUEST_TYPES.FORM:
            case REQUEST_TYPES.TEXT:            
                return _formData(request.data);
            case REQUEST_TYPES.JSON:
                return JSON.stringify(request.data);
        }
    }

    function _formData(data){
        var separator = ''
        ,   _data = '';

        var keys = Object.keys(data);
        for(var i=0; i<keys.length; i++){
            _data += separator + keys[i] + '=' + encodeURIComponent(data[keys[i]])
            separator = '&';
        }
        return _data;
    }

    function _setTypeHeaders(request){
        var headers = request.headers || {};
        if(!request.type) return headers;        

        switch(request.type){
            case REQUEST_TYPES.FORM:
            headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            break;

            case REQUEST_TYPES.JSON:
            headers['Content-Type'] = 'application/json; charset=utf-8';
            break;

            case REQUEST_TYPES.TEXT:
            headers['Content-Type'] = 'text/html; charset=utf-8';
            break;
        
            default:
                throw "Unsupported request type: " + request.type;
        }
        return headers;
    }

    function _handleStateChange(observer,transform){
        if(this.transport.readyState != READY_STATES.DONE) return;
        
        clearTimeout(this._requestTimeOut.timerId);

        // local filesystem requests on hybrid apps will respond
        // with status code 0
        if(this.transport.status === 0 && this.transport.response != null) {
            if(typeof observer.ok === 'function'){
                observer.ok(transform({
                    text:this.transport.responseText,
                    xml:this.transport.responseXML
                }));
            }    
        } else 
        switch(this.transport.status){
            case 200:
                if(typeof observer.ok === 'function'){
                    observer.ok(transform({
                        text:this.transport.responseText,
                        xml:this.transport.responseXML
                    }));
                }
            break;
            default:
                if(typeof observer.fail === 'function'){
                    observer.fail({code:this.transport.status});
                }
            break;
        }

        if(typeof observer.complete === 'function'){
            observer.complete();
        }
    }

	function httpPost(request) {
        var httpRequest= new HttpRequest(request);
        return function(observer){
            return _send.call(httpRequest, request.url, observer,'POST');
        }
	}

	function httpGet(request){
        var httpRequest= new HttpRequest(request);
        return function(observer){
            return _send.call(httpRequest, request.url, observer,'GET');
        }
	}

    httpGet.poll = function(request){
        var httpRequest = new HttpRequest(request);
        var interval = request.interval || 1000;
        return function(observer) {
            var _monitor = {  active:true };

            var fn = function() {
                var url = request.url;
                if(request.nocache === true){
                      url += '?'+Math.floor(Math.random() * 100000) + '' + Math.floor(Math.random() * 100000);
                }
                _send.call(httpRequest, url, {
                    ok:observer.ok,
                    fail:observer.fail,
                    complete:function() {
                        if(typeof(observer.complete) == 'function') {
                            observer.complete();
                        }
                        if(_monitor.active === true) {    
                            setTimeout(fn, interval);
                        }
                    }
                },'GET');
            }

            var control = {
                stop : function(){
                    _monitor.active = false;
                    return this;
                },    
                resume:function(){
                    _monitor.active = true;
                    fn(observer);
                    return this;
                }
            };

            fn(observer);
            return control;
        }
    };


    /**
     * 
     * Returns http request configuration
     * rooted at the provided url
     */
    function relative(url){
        var ctx = context(url,true);
        return {
            get:function(args){
                args.url = ctx.resolve(args.url);
                return new HttpRequest().request('GET',args);    
            },
            post:function(args){
                args.url = ctx.resolve(args.url);
                return new HttpRequest().request('POST',args);
            }
        }    
    }


    
    /**
     *  Remote Calls
     */
    function Remote(url, adapter){
        this.endpoint = url;
        this.adapter = adapter;
    };

    //arguemnt array of remote calls - array of strings,
    //or an object to receive remote call declarations
    Remote.prototype.calls = function calls(calls, endpoint, adapter) {

        var endpoint = this.endpoint;
        var adapter = this.adapter;  

        if (!(calls instanceof Array)) calls = [calls];
        var remote = this;

        for (var i = 0; i < calls.length; i++) {
            remote = this;

            var call = calls[i]
            , nparts = call.split('.')
            , fullCall = call;

            for (var n = 0; n < nparts.length - 1; n++) {
                if (!remote[nparts[n]]) remote[nparts[n]] = {};
                remote = remote[nparts[n]];
            }

            call = nparts[nparts.length - 1];

            if (remote[call] != null && remote[call] != undefined) continue;

            remote[call] = (function () {
                var methodName = this.methodName;
                var args = arguments;

                return function (oncomplete, onfailure) {
                    if (!oncomplete || typeof (oncomplete) !== 'function') return;

                    HttpRequest.post({
                        /* TODO: server end point URL, turn into a configurable property */
                        url: endpoint,

                        contentType: 'application/json;charset=UTF-8',

                        data: serialize(methodName, args, adapter),

                        onok: function (response) {
                            if (typeof (oncomplete) === 'function')
                            oncomplete(deserialize(response.text, adapter));
                        },

                        onfail: function (response) {
                            if (typeof (onfailure) === 'function')
                            onfailure(error(response.text));
                        }
                    });
                }
            }).bind({ methodName: fullCall });
        }
    };


    /**
     * 
     */
	function error(response, adapter) {
	    if (adapter != null) {
	        if (typeof adapter.error !== 'function') {
	            throw 'Remote call adapter must implement "error" method';
	        }
	        return adapter.error(response);
	    }
	    return "remote call error";
	};

    /**
     * 
     */
	function deserialize(response, adapter){
		if(adapter != null){
			return adapter.deserialize(response);
		}
		var result = JSON.parse(response.text);
		return result;
	};

    /**
     * 
     */
	function serialize(methodName, args, adapter) {
		var json = null;


		if (!args) args = [];

		if (adapter != null)
		    json = adapter.serialize(methodName, args);
        else
		    json = '{"request":{"Call":"' + methodName + '","Parameters":' + JSON.stringify(args) + '}}';

		log.debug(json);

		return json;
	};

    function remote(url, adapter) {
        return new Remote(url, adapter);
    };

    // module exports
    return {
        remote:remote,
        relative:relative,
        http : { 
            get:  httpGet, 
            post: httpPost
        },
        REQUEST_TYPES : {
            FORM: 1,
            TEXT: 2,
            JSON: 3
        }
    }

});
