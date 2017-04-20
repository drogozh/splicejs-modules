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
    var DEFAULT_TIMEOUT = 5000;

    var HttpRequest = function HttpRequest(request){
        this.transport =  new XMLHttpRequest();
        
        // setup onload handler
        this.transport.onload = (function(){
            _handleStateChange.call(this,this._observer);
        }).bind(this);
        
        this._url = request.url;

        // setup request object
        this._headers = _setTypeHeaders.call(this, request);

        // prepare data based on request type
        this._data = _prepareData.call(this, request);
	};


	HttpRequest.prototype.request = function(type,config){
        var params = ''
        ,   separator = ''
		,   requestURL = config.url
	 	,   self = this
        ,   requestTimeOut = {
            handle:0
        };

        if (config.formData)
        for(var d=0; d < config.formData.length; d++){
            params += separator + config.formData[d].name + '=' + encodeURIComponent(config.formData[d].value);
            separator = '&';
        }

        if(params.length > 0 && type === 'GET'){
            requestURL = requestURL + "?" + params;
        }

		this.transport.open(type,requestURL,true);

       // this.transport.setRequestHeader('Access-Control-Allow-Origin','*');

	    //custom content type
		if (config.contentType) {
		    this.transport.setRequestHeader('Content-Type', config.contentType);
		}

	    //form url encoded data
		else if (config.formData) {
		    this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
		}

        //post plain text
		else if (config.data) {
		    this.transport.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
		}

        /*
            in ie8 onreadystatechange is attached to a quasy window object
            [this] inside handler function will refer to window object and not transport object
        */
        function onLoadHandler(){
            if( requestTimeOut._isTimeOut == true) return;
            var transport = self.transport;

            var response = {
                text: transport.responseText,
                xml:  transport.responseXML
            };

            clearTimeout(requestTimeOut.handle);
            switch (transport.status) {
                case 200:
                    if(typeof config.onok == 'function') {
                        config.onok(response);
                    }
                    if(typeof(config.oncomplete) == 'function') {
                        config.oncomplete();
                    }
                    break;
                case 400, 401, 402, 403, 404, 405, 406:
                case 500:
                default:
                    if (typeof config.onfail == 'function') {
                         config.onfail(response);
                    }
                    if(typeof(config.oncomplete) == 'function') {
                        config.oncomplete();
                    }
                    break;
            }
        }

        if(this.transport.onload !== undefined ) {
            this.transport.onload = onLoadHandler;
        }
        else {
            this.transport.onreadystatechange = function(e){
                if(self.transport.readyState == 4 ) onLoadHandler.call(this);
            }    
        }

        if (type == 'POST' && !params) params = config.data;
		
        // exceptions thrown by the send method cannot be caught
        // hence we need a work-around using a timeout model
        requestTimeOut.handle = setTimeout(function(){
            requestTimeOut._isTimeOut = true;
            if(typeof config.onfail == 'function') { 
                config.onfail();
            }
            if(typeof config.oncomplete == 'function') {
                config.oncomplete();
            }
        },5000);


        this.transport.send(params);

        return this;
	};


    HttpRequest.prototype.stop = function(){
        this.transport.abort();
    }

    function _send(observer,verb){
        this._observer = observer;
        this._requestTimeOut = false;
        
        //start request
        this.transport.open(verb, this._url);

        // apply request headers
        var keys = Object.keys(this._headers);
        for(var i=0; i<keys.length; i++){
            this.transport.setRequestHeader(keys[i],this._headers[keys[i]]);
        }

        if(verb == 'POST')
            this.transport.send(this._request.data);
        else 
            this.transport.send();    

        return this;
    }


    function _prepareData(request){

    }

    function _setTypeHeaders(request){
        if(request.type && !REQUEST_TYPES[request.type])
        throw "Unsupported request type: " + request.type;

        var type = !REQUEST_TYPES[request.type];
        var headers = request.headers || {};

        switch(type){
            case REQUEST_TYPES.FORM:
            headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            break;

            case REQUEST_TYPES.JSON:
            headers['Content-Type'] = 'application/json; charset=utf-8';
            break;

            case REQUEST_TYPES.TEXT:
            headers['Content-Type'] = 'text/html; charset=utf-8';
            break;
        }

        return headers;
    }

    function _handleStateChange(observer){
        if(this.transport.readyState != READY_STATES.DONE) return;
        switch(this.transport.status){
            case 200:
                if(typeof observer.ok === 'function'){
                    observer.ok({
                        text:this.transport.responseText,
                        xml:this.transport.responseXML
                    });
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
            return _send.call(httpRequest,observer,'POST');
        }
	}

	function httpGet(request){
        var httpRequest= new HttpRequest(request);
        return function(observer){
            return _send.call(httpRequest, observer,'GET');
        }
	}


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
        }
    }

});
