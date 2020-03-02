define([

	'require',
	'../inheritance',
	'../component',
	'../event',
	'../view',
    '../interaction',
	'!dropdown.css',
	'!dropdown.html'
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

	DropDownContainer.prototype.reflow = function(){
		var boundingBox = this.elements.root.getBoundingBox();
		if( (boundingBox.height + boundingBox.top) >= window.innerHeight){
			var s = this.elements.root.node.style;
			var newHeight = window.innerHeight - boundingBox.top - 20;
			s.height = newHeight + 'px';
			s.width = boundingBox.width + 'px';
			boundingBox = this.elements.root.getBoundingBox();
			component.ComponentBase.prototype.reflow.call(this,0,0,boundingBox.width, boundingBox.height);
			return;
		}
	};

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
			onDropDown : event.MulticastEvent,
			onInitialDrop: event.UnicastEvent
		});
		this._isEnabled = true;
	}).extend(component.ComponentBase);


	DropDown.prototype.onInit = function(args){
		this.dropDownItem = args.dropDownItem;
		this.itemTemplate = args.itemTemplate;

		this.defaultValue = args.defaultValue || 'Select Item';

		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};
	}

	DropDown.prototype.onLoaded = function(){
		/*
		Subscribe to onclick instead of mousedown, because firing mousedown
		will immediately execute event within dropDown() closing the dropdown
		*/
		var _this = this;
		event.attach(this.elements.root,{
			onmousedown : view.DomMulticastStopEvent
		})
		.onmousedown.subscribe(function(e){
			if(!_this._isEnabled) return;
			this.dropDown();
		},this);

		if(this.itemTemplate != null) {
			this._itemTemplateInstance = this.set(new this.itemTemplate(this));
		}

		// sets default item
		this.clear();

		//create instance of dropdown container
		this.dropDownContainer = new scope.DropDownContainer(this);
		
		this._isInitialDrop = true;
	}

	DropDown.prototype.enable = function(isEnabled){
		this._isEnabled = isEnabled;
		if(this._isEnabled){
			this.elements.root.removeClass('disabled');
		} else {
			this.elements.root.addClass('disabled');
		}
	}

	DropDown.prototype.clear = function(){
		this.applyContent(this.defaultValue);
	}

	DropDown.prototype.applyContent = function(content){
		if(this._itemTemplateInstance != null) {
			this._itemTemplateInstance.applyContent(content);
			return;
		}
		component.ComponentBase.prototype.applyContent.call(this,content);
	}

	DropDown.prototype.close = function () {
	    _hide();
	};

	function _hide() {
	    dropDownContainer.remove();
        selectorElement.removeClass('sjs-dropdown-open');
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
            .appendClass('sjs-dropdown-open');


		// append drop down to the document root
		// add content to the content element
		if(this._isInitialDrop) {
			this.dropDownItem = this.dropDownContainer.set(this.dropDownItem);
		}

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

		if(this._isInitialDrop === true){
			this._isInitialDrop = false;
			this.onInitialDrop(this.dropDownItem);
		}

        //call event to notify listeners
		this.onDropDown();

		this.dropDownContainer.reflow();
	};

	function _closeDropDown(){
        this.close();
	}

    DropDown.prototype.close = function(){
        if(!this.isOpen) return;

		//decorate dropdown selector
        this.elements
            .selector
            .removeClass('sjs-dropdown-open');

        //unsubscribe from the off-focus event
        dropDownMonitor
            .offFocusEvent
            .unsubscribe(this.offFocusHandler);
        
        this.dropDownContainer.detach();
        this.isOpen = false;
	}

	return factory.define('DropDownSelector:dropdown.html',DropDown)    
});
