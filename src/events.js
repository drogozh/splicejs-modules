define(function(){
    /**
     * Unicast Event
     */
    function UnicastEvent(){
        this._listeners = [];
        this.__sjs_event__ = true;
    }

    UnicastEvent.prototype.subscribe = function(callback,instance){
        this._listeners[0] = {callback:callback, instance:instance};
    };

    UnicastEvent.prototype.dispose = function(){
        this._listeners = [];
    };

    UnicastEvent.prototype.raise = function(){
        _raise.apply(this._listeners, arguments);
    };

    
    /**
     * Multicast Event    
     */
    function MulticastEvent(){
        this._listeners = [];
        this.__sjs_event__ = true;
    }

    MulticastEvent.prototype.subscribe = function(callback, instance){
        this._listeners.push({callback:callback, instance:instance});
    };

    MulticastEvent.prototype.dispose = function(listener, instance){
        this._listeners = [];
    };

    MulticastEvent.prototype.raise = function(){
        _raise.apply(this._listeners, arguments);
    };

    MulticastEvent.prototype.single = function(listener){
        // find listener
        var sub = _getSubscription.call(this,listener);

        if(sub == null) {
            return new UnicastEvent();
        }

        var _event = new UnicastEvent();
        _event._listeners = [sub];
        return _event;
    };

    /**
     * MulticastStateEvent
     * Stores last raised value
     * Invokes initially subscribed listeners with last event state
     * Then-able action
     * Event is considered resolved after the very first raise() call
     */
    function MulticastResetEvent(action){
        this._listeners = [];
        this._state = null;
        this._resolved = false;
        this._queue = [];
        this._action = action;
        this.resolve();
    };

    MulticastResetEvent.prototype.resolve = function(){
        var _this = this;
        this._resolved = false;
        this._action(function(result){
            _this.raise(result);
        });
    };

    MulticastResetEvent.prototype.subscribe = function(callback, instance){
        this._listeners.push({callback:callback, instance:instance});
        if(this._resolved != true) return;
        callback.apply(instance, this._state);
    };

    MulticastResetEvent.prototype.raise = function(){
        this._state = arguments;
        this._resolved = true;
        _raise.apply(this._listeners, this._state);
        _raiseOnce.apply(this._queue, this._state);
    };

    MulticastResetEvent.prototype.then = function(callback){
        var thenable = new Thenable(callback);
        if(!this._resolved) {
            this._queue.push(thenable);
            return thenable;
        }
        thenable.callback.apply(null,this._state);
        return thenable;
    };    

    /**
     * Thenable
     * @param {function} callback 
     * @param {object} instance 
     */
    function Thenable(callback, instance){
        this.callback = callback;
    }

    Thenable.prototype.catch = function(callback){
        this.errorCallback = callback;
    };

    // private functions 
    function _getSubscription(listener){
        for(var i=0; i < this._listeners.length; i++ ){
            var sub = this._listeners[i];
            if(sub && sub.instance == listener) { return sub; }
        }
        return null;
    }

    function _raise(){
        var listeners = this;
        for(var i=0; i < listeners.length; i++ ){
            var sub = listeners[i];
            sub.callback.apply(sub.instance,arguments);
        }
    }

    function _raiseOnce(){
        var listeners = this;
        while(listeners.length > 0){
            var sub = listeners.shift();
            sub.callback.apply(sub.instance,arguments);
        }
    }

    return {
        MulticastEvent: MulticastEvent,
        MulticastResetEvent: MulticastResetEvent,
        UnicastEvent: UnicastEvent
    }
});