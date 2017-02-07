define([

	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
    '{splice.modules}/component.interaction',
    '!dropdown.css',
],
function(require,inheritance,component,event,view,interaction){
	"use strict";

    //static map to keep track of all the DropDown components
    //used to implement modal behavior
    var dropDownMonitor = {
		offFocusEvent : event.attach(window, {
		 	onmousedown	:	view.DomMulticastStopEvent
        }).onmousedown
    };

	/* dependency imports */
	var	Positioning = interaction.Positioning
	,	Class       = inheritance.Class
	;

	var scope = {};

    //get component factory
    var factory = component.ComponentFactory(require,scope);


    /**
     *      Simple drop-down container
     *  
     */
  	var DropDownContainer = Class(function DropDownContainer(){
	}).extend(component.ComponentBase);

    scope.DropDownContainer = 
    factory.define('DropDownContainer:dropdown.html',DropDownContainer);



    /**
     *  
     *      Resizeable drop-down container
     */
  	var DropDownContainerResizable = Class(function DropDownContainerResizable(){
	}).extend(component.ComponentBase);

    scope.DropDownContainerResizable = 
    factory.define('DropDownContainerResizable:dropdown.html',DropDownContainerResizable);



	/**
     *      DropDown view model
     * 
     */
	var DropDown = Class(function DropDown(parent,args){

		event.attach(this,{
			onDropDown : event.MulticastEvent
		});

		this.dropDownItem = args.dropDownItem;
		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};

	}).extend(component.ComponentBase);


	DropDown.prototype.onLoaded = function(){
		/*
		Subscribe to onclick instead of mousedown, because firing mousedown
		will immediately execute event within dropDown() closing the dropdown
		*/
		event.attach(this.elements.root,{
			onmousedown : view.DomMulticastStopEvent
		})
		.onmousedown.subscribe(function(e){
			this.dropDown();
		},this);

		//create instance of dropdown container
        this.dropDownContainer = new scope.DropDownContainer({},this);
	}


	DropDown.prototype.close = function () {
	    _hide();
	};


	function _hide() {
	    dropDownContainer.remove();
        selectorElement.removeClass('-sjs-dropdown-open');
	};


	DropDown.prototype.clientSize = function(client){

		var s = this.dropDownContainer.elements.root.style;

		var content = dom(client.concrete.dom);
		
		//	check if position adjustment is required to
		//	remain in client view
		var boxWidth = content.box().unit().width;
		var windowWidth = scope.Doc.window.width();

		//adjust left position by the pixels width
		if( (boxWidth + this.dropDownContainerSize.left) > windowWidth ){
			s.left = (windowWidth - boxWidth) + 'px';
		}
	};

	DropDown.prototype.dropDown = function(){
        //close any active drop-downs
        if(dropDownMonitor.current)
             dropDownMonitor.current.close();

        var selector = this.elements.selector;
        var containerRoot = 
            this.dropDownContainer
                .elements.root;

		var left = selector.node.offsetLeft
		,	height = selector.node.offsetHeight
		,	top = height
		,	s = containerRoot.node.style
		,	pos = Positioning.abs(selector.node);


		//decorate dropdown selector
        this.elements
            .selector
            .appendClass('-sjs-dropdown-open');


		//append drop down to the document root
		// add content to the content element
		this.dropDownContainer.set(this.dropDownItem);
        this.dropDownContainer.display();


		left = pos.x;
		top =  height +  pos.y;

		//user to adjust for screen overruns
		this.dropDownContainerSize.left = left;
		this.dropDownContainerSize.top = top;


		//set position and display mode of the drop-down container
		s.left = left + 'px';
		s.top =  top + 'px';
		s.display='block';

        //handler that will close the dropdown when 
        //mouse event on the windows is detected
		this.offFocusHandler = (function(){
			_closeDropDown.call(this);
			dropDownMonitor.offFocusEvent
                           .unsubscribe(this.offFocusHandler);
		}).bind(this);

		dropDownMonitor.offFocusEvent.subscribe(this.offFocusHandler,this);

        this.isOpen = true;

        //set current drop down
        dropDownMonitor.current = this;

        //call event to notify listeners
		this.onDropDown();

	};

	function _closeDropDown(){
        this.close();
	}

    DropDown.prototype.close = function(){
        if(!this.isOpen) return;

		//decorate dropdown selector
        this.elements
            .selector
            .removeClass('-sjs-dropdown-open');

        //unsubscribe from the off-focus event
        dropDownMonitor
            .offFocusEvent
            .unsubscribe(this.offFocusHandler);
        
        this.dropDownContainer.detach();
        this.isOpen = false;
    }

    return {
        DropDown : factory.define('DropDownSelector:dropdown.html',DropDown)
    }   
});
