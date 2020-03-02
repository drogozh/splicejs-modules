//todo: throw error on repeat attempts to subscribe to a unicast event
define(
[
  'inheritance',
  'async',
  'util'
],
function(inheritance,sync,util){
    "use strict";

    var 
        fname = util.fname
    ,   mixin = util.mixin
    ;

    var
      Class = inheritance.Class
    ;

    function Subscription(instance, callback){
      this.instance = instance;
      this.callback = callback;
    }
    Subscription.prototype = {
      disable:function(){this.isDisabled = true;},
      enable:function(){this.isDisabled = false;}
    };


    /**
     *    BaseEvent
     */
    function BaseEvent(){}
    BaseEvent.prototype.attach = function attach(){
      throw fname(this.constructor) + ' must iplement attach() function';
    };


    /**
     *    MulticastEvent
     */
    var MulticastEvent = Class(function MulticastEvent(){
    }).extend(BaseEvent);

    MulticastEvent.prototype.attach = function(instance, property){
        var event = _createMulticastEvent();
        _attachEvent(instance, property, event);
        return event;
    }

    /**
     *  Multicast queued event clears subscribed list each time
     *  after it fires
     */
    var MulticastQueueEvent = Class(function MulticastQueueEvent(){
    }).extend(BaseEvent);

    MulticastQueueEvent.prototype.attach = function(instance, property){
        var event = _createMulticastEvent(true);
        _attachEvent(instance, property, event);
        return event;
    };

    /**
     * 
     */
    var UnicastEvent = Class(function UnicastEvent(){
    }).extend(BaseEvent);

    UnicastEvent.prototype.attach = function(instance,property){
      var event = _createUnicastEvent();
      _attachEvent(instance,property,event);
      return event;
    };



    /*
        ------------------------------------------------------------------------------
        Private functions
    */
  
    function _attachEvent(o,p,e){
      if(!o || !p) return e;

      var v = o[p];
      if(v && v.__sjs_event__) return v;

      //target property is a function
      if(typeof v === 'function') {
          return e.subscribe(o,v);
      }
      return o[p] = e;
    }



    /*
      Multicast Event
    */

    function _createMulticastEvent(isQueued){
        var _closure = {subs:[]};
      
        var f = function MulticastEvent(){
            _multicastRun.apply(_closure,arguments);
            if(isQueued === true){
                _closure.subs = [];
            }
        };
      
        f.subscribe = function(callback,instance){
            if(callback == f) throw 'Recursive event subscription on ' + fname(instance.constructor) + ' "' + fname(callback)+'"';
            return _multicastSubscribe.call(f,_closure,callback,instance);
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

    function _multicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      var sub = new Subscription(instance,callback);
      _closure.subs.push(sub);
      return sub;
    }

    function _multicastUnsubscribe(_closure,callback){
      if(!_closure.subs) return;
      var subs = _closure.subs;
      for(var i = subs.length-1; i >= 0; i--){
        
        if( subs[i] == callback || subs[i].callback == callback) { 
          subs.splice(i,1);
          return; 
        }
      }
    }

    function _multicastDispose(_closure){
      _closure.subs = [];
    }

    function _multicastRun(){
        "use strict";
        if(!this.subs) return;
        var callbacks = this.subs;

        for(var key in callbacks){
            if(callbacks[key].isDisabled === true) continue;
            callbacks[key].callback.apply(callbacks[key].instance,arguments);
        }
    }



    /**
      Unicast event
    */
    function _createUnicastEvent(){
      var _closure = {sub:null};
      var f = function UnicastEvent(){
        _unicastRun.apply(_closure,arguments);
      };
      f.subscribe = function(callback,instance){
        _unicastSubscribe.call(f,_closure,callback,instance);
        return f.__sjs_owner__;
      };
      f.dispose = function(){
        _closure.sub = null;
      };
      f.unsubscribe = function(callback){
        if(_closure.sub === callback || _closure.sub.callback === callback)
          _closure.sub = null;
      };
      f.subscribers = function(){
        return _closure.sub != null ? 1 : 0;  
      };
      return f;
    }

    function _unicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      _closure.sub = new Subscription(instance,callback);
      return _closure.sub;
    }

    function _unicastRun(){
      if(!this.sub) return;
      //do not run disabled subscriptions
      if(this.sub.isDisabled === true) return;
      this.sub.callback.apply(this.sub.instance,arguments);
    }

    function _attach(instance,events){
        if(events instanceof BaseEvent){
            var e = events.attach(instance, null);
            e.__sjs_event__ = true;
            e.__sjs_owner__ = instance;
            return e;
        }

        var keys = Object.keys(events);
        for(var key in  keys){
            var evt = events[keys[key]];
            if(!evt) {
                throw 'Invalid event property ' + keys[key] + ':' + evt;
            }
            if(!(evt instanceof BaseEvent) ) {
                throw 'Invalid event property ' + keys[key] + ':' + fname(evt.constructor) + ' does not implement "attach(object, string)" function';
            }
            
            var e = evt.attach(instance, keys[key]);
            e.__sjs_event__ = true;
            e.__sjs_owner__ = instance;
        }
        return instance;
    }

    function _clear(instance, events) {
        if(events instanceof BaseEvent) {
            var e = events.clear(instance, null);
            return e;
        }
    }

    return {    
        BaseEvent: BaseEvent,
        attach: _attach,
        clear: _clear,
        createMulticastRunner: _createMulticastEvent,
        createUnicastRunner: _createUnicastEvent,
        MulticastEvent: new MulticastEvent(),
        MulticastQueueEvent : new MulticastQueueEvent(),
        UnicastEvent: new UnicastEvent()    
    };
});
