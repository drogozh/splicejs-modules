define([
	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/component.interaction',
	'preload|{splice.modules}/component.loader',
	'!popup.css'
],function(require,inheritance,component,event,interaction){
    "use strict";
	var scope = {}
	,	Class = inheritance.Class
	,	Positioning = interaction.Positioning;

	var factory = component.ComponentFactory(require,scope);

	var Popup = Class(function Popup(){
		this.ratio = { width: 4, height: 3 };
	}).extend(component.ComponentBase);


	
	Popup.prototype.onDisplay = function() {
	    var popup = this.elements['popup'];
	    var mask = this.elements['popupMask'];

	    //measure document
	    var dim = Positioning.windowsize();

	    var size = { width: 10, height: 10 };
	    var position = { left: 0, top: 0 };


	    size.width = Math.round(dim.width * 0.46);
	    size.height = Math.round(dim.height * 0.49);

        /*
	    if (dim.width <= dim.height) {
	        size.width = Math.round(dim.width / 3);
	        size.height = size.width * this.ratio.height / this.ratio.width;
	    } else {
	        size.height = Math.round(dim.height / 3);
	        size.width = size.height * this.ratio.width / this.ratio.height;
	    }
        */

	    position.left = Math.round(dim.width / 2 - size.width / 2)  / dim.width;
	    position.top = Math.round(dim.height / 2 - size.height / 2) / dim.height;

	    var s = popup.style;

	    s.left = Math.round(100 * position.left,2) + '%';
	    s.top = (-1*(size.height + 100)) + 'px';

	    s.width = 46 + '%';
	    s.height = 49 + '%';

	   // mask.style.visibility = 'visible';
	    s.visibility = 'visible';

	    window.setTimeout(function () {
	        s.opacity = 1;
	        s.top = Math.round(100 * position.top, 2) + '%';
	     //   mask.style.backgroundColor =  'rgba(35,35,35,0.85)';
	    }, 1);
	};

    
	return factory.define('Popup:popup.html',Popup);

});
