define(function(){

    function MulticastEvent(){
        this._listeners = [];
        var _this = this;
    }

    MulticastEvent.prototype.subscribe = function(callback, instance){
        this._listeners.push({callback:callback, instance:instance});
    };

    MulticastEvent.prototype.dispose = function(listener, instance){
        this._listeners = [];
    };

    MulticastEvent.prototype.raise = function(){
        for(var i=0; i < this._listeners.length; i++ ){
            var sub = this._listeners[i];
            sub.callback.apply(sub.instance,arguments);
        }
    };

    return {
        MulticastEvent: MulticastEvent
    }
});