define([	
    '{splice.modules}/inheritance',
    '{splice.modules}/event'
],function(inheritance, event){

var Class = inheritance.Class


//returns zero or a value
function z(n){
    if(!n) return 0;
    return n;
}

/** 
 *      Element positioning utilies
 * 
 */
var Positioning =  {

//@ Take mouse event object to return mouse position coordinates
mouse:function(e){
    //http://www.quirksmode.org/js/events_properties.html#position
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) 	{
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) 	{
        posx = e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }
    return {x:posx,y:posy};
},

/*
    Returns element coordinates in
    document.body coordinate space
    relative to top,left corner of the 
    client area
*/
abs: function(obj) {
    var n = obj
    ,   location  = [0,0];

    while (n != undefined) {
        location[0] += z(n.offsetLeft);
        location[1] += z(n.offsetTop);
        location[1] -= n.scrollTop;
        n = n.offsetParent;
    }

    return {
        x:location[0] + z(document.body.scrollLeft),
        y:location[1] + z(document.body.scrollTop)
    };
},

containsPoint:function(element,p) {
    pos = this.abs(element);

        pos.height = element.clientHeight;
        pos.width = element.clientWidth;

        if( p.x >= pos.x && p.x <= (pos.x + pos.width)) {
            if(p.y >= pos.y && p.y <= pos.y + (pos.height / 2))
            return 1;
            else if(p.y >= pos.y + (pos.height / 2) && p.y <= pos.y + pos.height )
            return -1;
        }
    return 0;
},

docsize:function(){
    var docWidth = document.body.offsetWidth?document.body.offsetWidth:window.innerWidth;
    var docHeight = document.body.offsetHeight?document.body.offsetHeight:window.innerHeight;

    return {width:docWidth, height:docHeight};
},

windowsize: function () {
    return { width: window.innerWidth, height: window.innerHeight };
}
};



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
    DragAndDrop: DragAndDrop,
    KeyListener: KeyListener,
    Positioning: Positioning
}

});