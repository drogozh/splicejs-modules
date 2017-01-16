define([	
    '{splice.modules}/inheritance',
    '{splice.modules}/event'
],function(inheritance, event){

var Class = inheritance.Class

/**
 *      DragAndDrop Interaction
 */
var DragAndDrop =  
{
    draggable:null,
    dummy:null,
    started:false,

    /* contains position of the original click */
    offset:null,

    //array of DOM elements that track drop event
    trackers:null,

    startDrag:function(elementnode, event){

    this.ondragfired = false;
        this.disableSelection(document.body, event);
        //get original position of the trigger node
        //p = JSPositioning.absPosition(elementnode);
        var p = Positioning.mouse(event);

        this.offset = {x:p.x,y:p.y};

        document.body.onmousemove = function(event) {DragAndDrop.drag(event);	};
        document.body.onmouseup   = function(event) {DragAndDrop.stopdrag(event);	};

        // event.preventDefault();
        this.onpickup(p);
    },

    stopdrag:function(e) {

        document.body.onmousemove = function(){};
        document.body.onmouseup = function(){};

        this.enableSelection(document.body);
        this.ondragfired = false;
        this.onstop();
    },

    drag:function(e) {
        var mousePos = Positioning.mouse(e);
        this.ondrag(mousePos,DragAndDrop.offset);
        if(this.ondragfired === false) {
            this.onbegin();
        }
        this.ondragfired = true;
        document.body.style.cursor='default';
    },

    onpickup:function(){},
    onbegin:function(){},
    ondrag:function(){},
    ondrop:function(){},
    onstop:function(){},

    setOpacity:function(element,value){
        element.style.opacity = value/100;
        element.style.filter = 'alpha(opacity=' + value + ')';
        element.style.zindex = 100;
    },

    disableSelection: function(element) {
        element.onselectstart = function() {return false;};
        element.unselectable = "on";
        element.style.MozUserSelect = "none";

    },

    enableSelection: function(element){
        element.onselectstart = null;
        element.unselectable = "off";
        element.style.MozUserSelect = "all";

    }
};

/**
 *      Global KeyListener
 *
 */
var KeyListener = Class(function KeyListener(){

    event.attach(this,{
        onEsc	: event.MulticastEvent,
        onEnter	: event.MulticastEvent,
        onRight : event.MulticastEvent,
        onLeft  : event.MulticastEvent,
        onUp	: event.MulticastEvent,
        onDown 	: event.MulticastEvent
    });

    event.attach(window, 'onkeydown').subscribe(
    function(args){
        switch(args.keyCode){
            case 27: this.onEsc(); 		break;
            case 13: this.onEnter(); 	break;
            case 37: this.onLeft(); 	break;
            case 38: this.onUp();		break;
            case 39: this.onRight(); 	break;
            case 40: this.onDown();		break;
        }
    }, this);

});



return {
    DragAndDrop : DragAndDrop,
    KeyListener: KeyListener
}

});