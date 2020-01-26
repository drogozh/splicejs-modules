define(function(){

    var EVENT_TYPE = {
        MULTICAST:'multicast',
        UNICAST:'unicast'
    };

    function Subscription(callback){
        this._callback = callback;
        this._enabled = true;
    }

    Subscription.prototype.enable = function enable(isEnabled){
        this._enabled = isEnabled;
    };

    /**
     * Multicast Event    
     */
    function MulticastEvent(){
        return _createEvent(EVENT_TYPE.MULTICAST);
    }

    function UnicastEvent(){
        return _createEvent(EVENT_TYPE.UNICAST);
    }

    function _createEvent(eventType){
        var _closure = {subs:[]};
        
        var f = function MulticastEvent(){
            _raiseEvent(f,_closure,arguments);
        };

        f.__sjs_event__ = true;
        f.__sjs_event_type__ = eventType;

        f.subscribe = function(callback){
            if(callback == f) throw 'Recursive event subscription';
            return _subscribeToEvent(f,_closure,callback);
        };
        
        f.unsubscribe = function(callback){
            return _multicastUnsubscribe.call(f,_closure,callback);
        };

        f.dispose = function(){
            return _multicastDispose(_closure);
        };

        f.subscribers = function(){
            return _closure.subs.length;  
        };
        return f;
    }

    function _subscribeToEvent(event, closure, callback){
        var subscription = new Subscription(callback);
        if(event.__sjs_event_type__ == EVENT_TYPE.MULTICAST){
            closure.subs.push(subscription);
            return subscription;
        }

        if(event.__sjs_event_type__ == EVENT_TYPE.UNICAST){
            closure.subs = [subscription];
            return subscription;
        }
    }

    function _raiseEvent(event,closure,arguments){
        for(var i=0; i<closure.subs.length;i++){
            var sub = closure.subs[i];
            if(!sub._enabled) continue;
            sub._callback.apply(sub,arguments);
        }
    }

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

    MulticastResetEvent.prototype.reset = function(){
        this._resolved = false;
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
        var result = null;
        for(var i=0; i < listeners.length; i++ ){
            var sub = listeners[i];
            result = sub.callback.apply(sub.instance,arguments);
        }
        return result;
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
        UnicastEvent: UnicastEvent,
        MulticastResetEvent: MulticastResetEvent
    }
});