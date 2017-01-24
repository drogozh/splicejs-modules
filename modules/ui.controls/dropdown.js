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
    var dropDownMap = {}


	/* dependency imports */
	var	Positioning = interaction.Positioning
	,	Class       = inheritance.Class
	;

	var scope = {

    };

    //get component factory
    var factory = component.ComponentFactory(require,scope);

	//static single instance
	var dropDownContainer = null
	,	selectorElement = null;


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
	var DropDown = Class(function DropDown(args){

		event.attach(this,{
			onDropDown : event.MulticastEvent
		});

		this.dropDownItem = args.dropDownItem;
		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};
		this.dataPath = '';

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

	DropDown.prototype.setItemTemplate = function(tmpl){
		this.itemTemplate = tmpl;
		this.content(tmpl).replace();
	}

	DropDown.prototype.onDataIn = function(item){
		if(!this.itemTemplate)
			this.content(item.getValue()).replace();
	};

	DropDown.prototype.onDataItemChanged = function(item){
		this.onDataIn(item);
	};


	DropDown.prototype.close = function () {
	    _hide();
	};


	function _hide() {
	    dropDownContainer.remove();
		
        selectorElement.cl('-sjs-dropdown-open').remove();
	};


	DropDown.prototype.clientSize = function(client){

		var s = this.dropDownContainer.elements.root.style;

		var content = dom(client.concrete.dom);
		/*
			check is position adjustment is required to
			remain in client view
		*/
		var boxWidth = content.box().unit().width;
		var windowWidth = scope.Doc.window.width();

		//adjust left position by the pixels width
		if( (boxWidth + this.dropDownContainerSize.left) > windowWidth ){
			s.left = (windowWidth - boxWidth) + 'px';
		}
	};

	DropDown.prototype.dropDown = function(){

		var left = this.elements.selector.offsetLeft
		,	height = this.elements.selector.offsetHeight
		,	top = height
		,	s = this.dropDownContainer.elements.root.style
		,	pos = Positioning.abs(this.elements.selector)
		,	self = this
		;

		//release previous selector if any
		if(selectorElement){
			view.css.removeClass(selectorElement,'-sjs-dropdown-open');
		}

		//create instance of the dropdown content item
		// if(!this.dropDownItemInst && this.dropDownItem) {
		// 	this.dropDownItemInst = new this.dropDownItem({parent:this});
		// }

		//keep track of the current drop down controller statically
		view.css.addClass(this.elements.selector,'-sjs-dropdown-open');
        selectorElement = this.elements.selector;

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


		var offFocusEvent = event.attach(window, {
		 	onmousedown	:	view.DomMulticastStopEvent
        }).onmousedown;
		
		var fn = (function(){
			_closeDropDown.call(this);
			offFocusEvent.unsubscribe(fn);
		}).bind(this);

		offFocusEvent.subscribe(fn,this);

		this.onDropDown(this.data);

	};

	function _closeDropDown(a,b,c,d){
		//close drop-down here
        this.close();
	}

    DropDown.prototype.close = function(){
        if(!this.dropDownContainer) return;
            this.dropDownContainer.detach();
    }

    return {
        DropDown : factory.define('DropDownSelector:dropdown.html',DropDown)
    }   
});
