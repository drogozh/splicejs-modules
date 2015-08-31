sjs({

required:[ 
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	'splice.controls.listbox.css',
	'splice.controls.listbox.html'
],

definition:function(){

	
	var Component = this.framework.Component
	, 	Class = this.framework.Class
	,	UIControl = this.SpliceJS.UI.UIControl
	,	debug = this.framework.debug;
	

	var ListBox = Class(function ListBox(args){

		if(!args) args = [];

		if(args.isScrollable)
			return new ScrollableListBox(args);	
		else 
			return new StretchListBox(args);

	});


	var ScrollableListBox = Component('ScrollableListBox')(function ScrollableListBox(){
			debug.log('Creating ScrollableListBox');

			this.scrollPanel 	= this.ref.scrollPanel;
			this.contentClient 	= this.ref.scrollPanel.ref.contentClient;	 
		}
	).extend(UIControl);

	ScrollableListBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		this.contentClient.concrete.dom.innerHTML = '';

		var item = null;
		
		for(var i=0; i<dataItem.length; i++) {
			if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				item.dataIn(this.dataItem[i]);
				
				if(this.contentClient){
					this.contentClient.concrete.dom.appendChild(item.concrete.dom);
					if(typeof item.onAttached == 'function') 
						item.onAttached();
				}
			}
		}

		this.reflow();
		
	};

	ScrollableListBox.prototype.reflow = function(){
		this.ref.scrollPanel.reflow();
	};

	var StretchListBox = Component('StretchListBox')(function StretchListBox(){
		}
	);


	var ListItem = Class(function ListItem(args){
		UIControl.call(this,args);
	
		var self = this;
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};

	}).extend(UIControl);


	ListItem.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		this.concrete.applyContent(dataItem);
		this.dataOut(dataItem);
	};




	var GroupedListItem = Class(function GroupedListItem(args){
		this.groupInstance = null;
		this.itemInstances = [];
	});



	GroupedListItem.prototype.dataIn = function(dataItem){

		if(!this.groupInstance) { 
			if(this.groupTemplate) { 
				this.groupInstance = new this.groupTemplate({parent:this}); 
				Doc.$(this.elements.root).embed(this.groupInstance);
			}
		}

		if(this.groupInstance) this.groupInstance.dataIn(dataItem);


		if(this.itemInstances.length < 1) {
			if(dataItem.children) {
			for(var i=0; i<dataItem.children.length; i++){
				var item = new this.groupItemTemplate({parent:this});
				item.dataIn(dataItem.children[i]);
				this.itemInstances.push(item);
				this.elements.root.appendChild(item.concrete.dom);	
			}}
		}

	};

	//exporting objects
	return {
		ListBox:			ListBox,
		ScrollableListBox:	ScrollableListBox,
		StretchListBox:		StretchListBox,
		ListItem:			ListItem,
		GroupedListItem:	GroupedListItem
	}

}


});