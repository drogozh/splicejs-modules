/* global _ */
_.Module({
	
required:[
	
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	'splice.controls.css',
	'splice.controls.datatable.css',
	'splice.controls.datatable.html'
],

definition:function(){
	
	function _if(obj){
		if(!obj) return {};
		return obj;
	}
	
	var Class = this.framework.Class
	,	Event = this.framework.Event
	,	Component = this.framework.Component;
	
	var UIControl = this.SpliceJS.UI.UIControl; 
	
	/**
	 * DataTable
	 * */
	var DataTable = Class(function DataTable(args){
		/* call parent constructor */
		UIControl.apply(this,arguments);
		
		var self = this;

		this.dom = this.ref.tableBody.elements.dataTable;
		this.elements.dataTable = this.ref.tableBody.elements.dataTable;
		
		this.elements.columnHeaderTable = null; 
		
		if(this.ref.tableHeader)
			this.elements.columnHeaderTable = this.ref.tableHeader.elements.columnHeaderTable;

		/* temp data buffer */	
		this.source_data = null;	

		/* temp dom data hold */	
		this.dataRows = [];
		this.headerRow = null;

		Event.attach(window, 'onresize').subscribe(function(){self.reflow();});
		
	}).extend(UIControl);
	
	
	
	DataTable.prototype.filterData = function(data_filter){
		this.data_filter = data_filter;
		_renderTable.call(this);
	};
	
	DataTable.prototype.clearFilter = function(){
		this.data_filter = null;	
	
	};

	function _applyFilter(){
		/*
			Apply search filters
		*/
		if(this.data_filter){
			
			var filtered_data = { headers:this.source_data.headers, data:[]};
			var source_data = this.source_data.data;
			
			
			for(var i=0; i < source_data.length; i++){
				for(var j=0; j< source_data[i].length; j++){
					var v = source_data[i][j]; 
					if(!v) continue;	
					if((v+'').indexOf(this.data_filter) > -1) { 
						filtered_data.data.push(source_data[i]);
						break;
					}
				}
			}
			return filtered_data;
		}
		return this.source_data;
	};


	function _renderTable(){
		
		var filtered = _applyFilter.call(this);
		
		var data 	= filtered.data;
		var headers = filtered.headers;
		
		/* add columns */
		if(headers instanceof Array) {
			if(this.headerRow) this.headerRow.dataIn(headers);
			else {
				/* custom header row content */
				if(this.headerTemplate){
					this.headerRow = new this.headerTemplate({parent:this});
					this.headerRow.dataIn(headers);
					this.addDomHeader(this.headerRow.concrete.dom);
				}
				/* standard table header row */
				else {
					this.addDefaultHeader(headers);
				}
			}
		}
		
		
		/* data must be an array of objects */
		if(!(data instanceof Array)) return;
		
		/* udpate existing rows */
		for(var j=0; j < this.dataRows.length; j++){
			if(!data[j]){
				/* remove extra dataRows and table rows*/
				for(var k=this.dataRows.length-1; k>=j; k--){
					this.removeRowByIndex(k+1); //!!!!! this is because of the header row
					this.dataRows.splice(k,1);
				}
				break;
			}
			this.dataRows[j].dataIn(data[j]);
		}
				
		/* add new rows*/
		var domModified = false;
		for(var i=j; i<data.length; i++){
			var r = data[i];
			
			/* insert templated row */
			if(this.itemTemplate) {
				var dataRow = new this.itemTemplate({parent:this});
				
				this.dataRows.push(dataRow);
				
				dataRow.dataIn(r);
				
				this.addDomRow(dataRow.concrete.dom);
				domModified = true;

				dataRow.onDisplay();

				continue;
			}
			
			this.addBodyRow(createDefaultRow(r));
			domModified = true;
		}
		this.onDomChanged();
		this.reflow();
	};

	/*
	 * Updating data model
	 * - keep count of existing rows
	 * - keep references to individual rows
	 * - iterate over existing rows to update row's calling dataIn on the row object
	 * - if new rows create new rows in the table 
	 * 
	 * */
	DataTable.prototype.dataIn = function(dataInput){
		
		this.source_data = dataInput;
		_renderTable.call(this);		
		
	};
	
	
	function createDefaultRow(r){
		var row = [];
		for(var i=0; i< r.length; i++ ){
			row.push(document.createTextNode(r[i]));
		}
		return row;	
	};



	DataTable.prototype.removeRowByIndex = function(rowIndex){
		this.dom.deleteRow(rowIndex);
	};
	
	DataTable.prototype.clear = function(){
	};
	

	
	DataTable.prototype.addRowTo = function(destination, row,isHeader){
		
		var newrow =  destination.insertRow();

		for(var i=0; i < row.length; i++ ){
		    var cell = null;

		    if (isHeader) {
		        cell = document.createElement('th');
		        newrow.appendChild(cell);
		    }
		    else {
		        cell = newrow.insertCell();
		    }
						
			if(typeof(row[i]) == 'object')
				cell.appendChild(row[i]);
			else {
				cell.appendChild(document.createTextNode(row[i]));
			}
		}
	};

	DataTable.prototype.addHeaderRow = function(dom,headers){

		if(!headers) 	return;
		if(!dom)		return;
		if(dom.tHead) dom.deleteTHead();
		
		var tHead = dom.createTHead();
		
		this.addRowTo(tHead, headers, true);
	};

	DataTable.prototype.addBodyRow = function(row){
		
		if(!row) return;
		if(!(row instanceof Array)) throw 'Argument must be of type Array';
		
		var tBody = this.dom.tBodies[0]; 
		if(!tBody) tBody = this.dom.createTBody();
		
		this.addRowTo(tBody,row);
	};

	DataTable.prototype.addDomRow = function(dom){
		var row = [];	
		for(var i=0; i< dom.childNodes.length; i++){
			var node = dom.childNodes[i];
			/* element nodes only */
			if(node.nodeType === 1) row.push(node);
		}
		this.addBodyRow(row);
	};

	DataTable.prototype.addDefaultHeader = function(headers){
		var row = [], cloned = [];

		for(var i=0; i<headers.length; i++){
			row.push(document.createTextNode(headers[i]));
			cloned.push(document.createTextNode(headers[i]));
		}

		this.addHeaderRow(this.elements.columnHeaderTable, row);
		this.addHeaderRow(this.elements.dataTable, cloned);
	};

	DataTable.prototype.addDomHeader = function(dom){
		var row = [];	
		for(var i=0; i< dom.childNodes.length; i++){
			var node = dom.childNodes[i];
			/* element or text nodes only */
			if(node.nodeType === 1) row.push(node);
		}
		/*
			Data table gets cloned row
		*/
		var cloned = [];
		for(var i=0; i<row.length; i++){
			cloned[i] = row[i].cloneNode(true);
		}
		this.addHeaderRow(this.elements.columnHeaderTable, row);
		this.addHeaderRow(this.elements.dataTable, cloned);
	};

	DataTable.prototype.reflow = function(){
		/* user offsetWidth it included border sizes */
		/* 
			try controling table width using cell widths
			instead of setting total table width explicitly
		*/
		//this.elements.columnHeaderTable.style.width = this.elements.dataTable.offsetWidth  + 'px';
		/* measure column sizes */
		var body = this.elements.dataTable.tHead;
		var head = _if(this.elements.columnHeaderTable).tHead;
		var wrapper = this.ref.tableBody.elements.tableWrapper;


		if(!body) return; //empty table no records were added

		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEEDS TO WORK WITH CALCULATED STYLES 
		if(body.clientWidth < wrapper.clientWidth) {
			this.elements.dataTable.style.width = (wrapper.clientWidth - 1)  + 'px';
		}
		
		// we are using scroll panel, reflow
		if(this.ref.scrollPanel) this.ref.scrollPanel.reflow();
		
		if(!body || !head) return;

		var cells = body.rows[0].cells;
		for(var i=0; i< cells.length; i++){
			
			var cellWidth = cells[i].clientWidth;
			var style = _.Doc.style(cells[i]);

			head.rows[0].cells[i].style.minWidth = (cellWidth 
				 - style.padding.left.value 
				 - style.padding.right.value) + 'px';
		}
	};

	
	var DataTableRow =  Class(function DataTableRow(args){
		UIControl.call(this);
		/* 
		 * process content placeholders before they are 
		 * pulled by parent control
		 * */
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
		this.contentMap = [];
		
		for(var i=0; i<textNodes.length; i++){
			var value = textNodes[i].nodeValue;
			if(!value) continue;
			if(value.indexOf('@') !== 0) continue;
		
			var key = value.substring(1,value.length);
			
			var span = document.createElement('span');
			textNodes[i].parentNode.replaceChild(span,textNodes[i]);
			this.contentMap[key] = span;
		}
	}).extend(UIControl);
	
	DataTableRow.prototype.onDeleteClick = function(){
		this.onDelete(this.data);
	};

	DataTableRow.prototype.onHighlightValue = function(){};
	
	DataTableRow.prototype.dataIn = function(data){
		
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
		this.data = data;
		

		var highlightValue = null;
		if(this.onHighlightValue) {
			var highlightValue = this.onHighlightValue();
		}

		for(var key in this.contentMap){
			var node = this.contentMap[key];
			if(!this.contentMap.hasOwnProperty(key)) continue;
			
			var value = data[key];
			if(node){
				if(highlightValue) {
					node.innerHTML = splitHighlightValue(value,highlightValue);		
				} else {
					node.innerHTML = value;
				}
			}
		}
		
		this.dataOut(this.data);
	};
	
	DataTableRow.prototype.dataOut = Event;

	function splitHighlightValue(value,hv){
		if(value == null || value == undefined) return value;
		return value.replace(new RegExp(hv,'gi'),'<span class="-search-result-highlight">'+hv+'</span>');
	}


	/* DataTable variants */
	var CustomScrollDataTable = Component('CustomScrollDataTable')(DataTable);
	var NoScrollDataTable = Component('NoScrollDataTable')(DataTable);
	
	var _DataTable = function _DataTable(args){
		
		if(args.scroll === 'no') return new NoScrollDataTable(args);
		return new CustomScrollDataTable(args);
		
	};



	//module exports
	return {
		DataTable: _DataTable,
		DataTableRow: DataTableRow
	}

// end module definition
}});