define(['loader'
],function(loader){
  "use strict";

  var context = loader.context;

    /**
     *  HttpRequest
     */
    var HttpRequest = function HttpRequest(){
		var a = Array("Msxml2.XMLHTTP","Microsoft.XMLHTTP");
    	if (window.ActiveXObject)
        for (var i = 0; i < a.length; i++) {
           	this.transport = new ActiveXObject(a[i]);
        }
        else if (window.XMLHttpRequest)   this.transport =  new XMLHttpRequest();
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
            var transport = self.transport;

            var response = {
                text: transport.responseText,
                xml:  transport.responseXML
            };

            clearTimeout(requestTimeOut.handle);
            switch (transport.status) {
                case 200:
                    if(typeof config.onok == 'function') config.onok(response);
                    break;
                case 400, 401, 402, 403, 404, 405, 406:
                case 500:
                default:
                    if (typeof config.onfail == 'function') config.onfail(response);
                    break;
            }
        }

        if(this.transport.onload !== undefined ) {
            this.transport.onload = onLoadHandler;
        }
        else {
            this.transport.onreadystatechange = function(e){
                if(self.transport.readyState == 4 ) onLoadHandler();
            }    
        }

        if (type == 'POST' && !params) params = config.data;
		
        // exceptions thrown by the send method cannot be caught
        // hence we need a work-around using a timeout model
        requestTimeOut.handle = setTimeout(function(){
            if(typeof config.onfail == 'function') config.onfail();
        },5000);
        this.transport.send(params);

        return this;
	};

	function httpPost(config) {
		return new HttpRequest().request('POST',config);
	};

	function httpGet(config){
		return new HttpRequest().request('GET',config);
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
        }
    }

});
