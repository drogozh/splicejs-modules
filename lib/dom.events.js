define([
    'events',
    'inheritance'
],function(events, inheritance){

    function OnClick(element){
        this._element = element;
        this._event = new events.UnicastEvent();        
        
        var _this = this;
        this._element.node.onclick = function(e){
            if(!e) e = window.event;
            e.cancelBubble = true;
	        if (e.stopPropagation) e.stopPropagation();
            _this._event({element:_this._element});
        };        
    };

    OnClick.prototype.subscribe = function(func){
        this._event.subscribe(func);
    };

    OnClick.prototype.dispose = function(){
        this._event.dispose();
        this._element.node.onclick = null;
        this._element = null;
    };

    return {
        OnClickEvent: OnClick
    }
});