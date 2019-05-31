define([
    'events',
    'inheritance'
],function(events, inheritance){

    var OnClick = inheritance.Class(function OnClick(){
        events.UnicastEvent.call(this);
    }).extend(events.UnicastEvent);

    OnClick.prototype.attach = function(node){
        var _this = this;
        node.onclick = function(e){
            if(!e) e = window.event;
            e.cancelBubble = true;
	        if (e.stopPropagation) e.stopPropagation();
            _this.raise();
        };
        return this;
    };

    return {
        OnClick: OnClick
    }
});