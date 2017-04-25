define([	
	'require',
	'{splice.modules}/inheritance',
	'{splice.modules}/component',
	'{splice.modules}/event',
	'{splice.modules}/view',
	'{splice.modules}/component.interaction',
    '{splice.modules}/util',
    '{splice.modules}/async',
	'preload|{splice.modules}/loader.css',
    '!gridlayout.css'

],function(require,inheritance,component,event,dom,interaction,utils,_async){
 
    var	Class 		= inheritance.Class
	,	DragAndDrop = interaction.DragAndDrop
	,   proxy 		= component.proxy
    ,   foreach     = utils.foreach
    ,   mixin       = utils.mixin
	,	log			= console;

	/**
	 * 
	 * 
	 */
	var Grid = function Grid(rows,columns){
		this.rows 		= rows;
		this.columns 	= columns;

		//fill matrix, keeps track of the grid fill positions
		this.positions = Array(this.rows*this.columns);
	};

	Grid.prototype.fillGrid = function(row, col, rowspan, colspan, card){
		for(var i=row; i < row+rowspan; i++){
			for(var j=col; j < col + colspan; j++) {
				this.positions[i*this.columns+j] = card;
			}
		}
	};

	Grid.prototype.clear = function(){
		for(var i=0; i<this.positions.length; i++){
			this.positions[i] = 0;
		}
	};

	Grid.prototype.setSize = function(rows, columns){
		this.rows = rows;
		this.columns = columns;
	};

	/*
	 * Returns content of the grid cell if any
	 * */
	Grid.prototype.getCellContent = function(row,column){
		return this.positions[row*this.columns+column];
	};


	Grid.prototype.emptyCell = function(){
		for(var i=0; i<this.positions.length; i++){
			if(!this.positions[i]){
				return {row:Math.floor(i/this.columns),
						col:i % this.columns};
			}
		}
	};

	var left 	= 1
	,	top 	= 2
	,	right 	= 3
	,	bottom 	= 4
	,	move 	= 5;

	/**
	 * 
	 * 
	 */
	var CellContainer = Class(function CellContainer(parent,args){
        mixin(this,args);

	}).extend(component.ComponentBase);

    CellContainer.prototype.onInit = function(args){

        //event.attach(this,{ onResize        : event.MulticastEvent});
        //workaround for event attacher
        this.onResize = null;

   		event.attach(this,{
			onAdd 			: event.MulticastEvent,
			onStartMove 	: event.MulticastEvent,
			onMove 	  		: event.MulticastEvent,
			onEndMove 		: event.MulticastEvent,
			onStartResize   : event.MulticastEvent,
			onEndResize     : event.MulticastEvent,
			onCellSize 	    : event.MulticastEvent,
			onRemove 		: event.MulticastEvent,
            onResize        : event.MulticastEvent,
			onMaximize 		: event.MulticastEvent
		})

		this.onStartResize.subscribe(this.startResize, this);
		this.onEndResize.subscribe(this.endResize, this);
		this.onStartMove.subscribe(this.startMove,this);

    }


	CellContainer.prototype.onLoaded = function(args){


		//initialize user interraction events
		event.attach(this.elements.leftEdge,{
			onmousedown : dom.DomUnicastEvent
		}).onmousedown.subscribe(
			function(e){
                this.onStartResize(e,left);
            }, this
		);

		event.attach(this.elements.topEdge,{
			onmousedown : dom.DomUnicastEvent
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,top);}, this
		);

		event.attach(this.elements.rightEdge,{
			onmousedown : dom.DomUnicastEvent
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,right);}, this
		);

		event.attach(this.elements.bottomEdge,{
			onmousedown	: dom.DomUnicastEvent
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,bottom);}, this
		);
	};

	CellContainer.prototype.startResize = function(e,direction){
		log.debug('Resizing in ' + direction + ' direction');
		DragAndDrop.startDrag(e.source, e.domEvent);

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:direction, src:self});
			self.onCellSize(self);
		}
	};


	CellContainer.prototype.startMove = function(){
		DragAndDrop.startDrag();

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:move, src:self});
			self.onCellSize(self);
		}
	};


	CellContainer.prototype.remove = function(){
		this.onRemove(this);
	};

	CellContainer.prototype.maximize = function(){
		this.onMaximize(this);
	};

	var DEFAULT_OUTTER_MARGIN = 10;
	var DEFAULT_MARGIN = 10;


	/**
	*
	*	Grid Layout implementation
	* @constructor
	*/
	var GridLayout = Class(function GridLayoutController(parent,args){
		mixin(this,args);

		event.attach(this,{
			onRemoveCell : event.MulticastEvent
		});


		//default gap values
		if(!this.margin) 		this.margin = 10;
		if(!this.outerMargin) 	this.outerMargin = 10;


		// a collection of cells, contained in a null object
        this.layoutCells = {};
		// cell sequence counter
		this.cellSequence = 1;

	}).extend(component.ComponentBase);


	GridLayout.prototype.onInit = function(args){
		
		//	hook into window resize event only if grid layout
		//	is configured as a toplevel component
		if(this.attachToParent === true ) {
			event.attach(window,{
                onresize : event.MulticastEvent
            }).onresize.subscribe(function(){this.reflow();},this);
	    }

        //determine grid dimensions
        var cols = utils.max(args.cells,function(cell){return cell.col+1;}, 2 || args.cols);
        var rows = utils.max(args.cells,function(cell){return cell.row+1;}, 2 || args.rows);
		this.grid = new Grid(rows, cols);

        //add cells
        foreach(args.cells,(function(cell){
            this.addCell(cell.body,[cell.row,cell.col,cell.rowspan,cell.colspan]);    
        }).bind(this));

	};



	// GridLayout.prototype.onDisplay = function(){

	// 	/* processes layout cells */
	// 	if(this.cells && this.cells.length > 0){

	// 		for(var i=0; i< this.cells.length; i++) {
	// 			addCell.call(this,	this.cells[i].content,
	// 				[this.cells[i].row, this.cells[i].col,
	// 				this.cells[i].rowspan, this.cells[i].colspan]);
	// 		}
	// 		this.reflow();
	// 	}
	// };


	/* private */
/*
	function restoreCell(cell){
	//	cell.onResize.subscribe(this.resizeCell, this);
	//	cell.onRemove.subscribe(this.removeCell, this);
		this.layoutCells[cell.index] = cell;
		this.views.root.appendChild(cell.concrete.dom);
		cell.onAttach();
		cell.onDisplay();
	}
*/
	function addCell(content, position){
		if(content instanceof CellContainer){
			this.layoutCells[content.index] = content;

			if(content.isSoftRemoved) {
				content.concrete.dom.style.display = 'block';
				content.isShown = true;
				content.onDisplay();
				return;
			}

			//add cell
			this.content(content).add();

			content.isAttached = true;
			content.isShown = true;

			content.onAttach();
			content.onDisplay();
			content.onAdd(content);
			return;
		}

		var row = position[0]
		,	col = position[1]
        ,	rowSpan = (position[2] ? position[2] : 1)
        ,	colSpan = (position[3] ? position[3] : 1);

		
        
        
        // var _CellContainer = proxy.call(scope,
		// {	type:'CellContainer',
		// 	row:row,
		// 	col:col,
		// 	colspan:colSpan,
		// 	rowspan:rowSpan,
		// 	content:{body: content}
		// });

		var cellIndex = this.cellSequence++;

		var cell =  new CellContainerComponent({
			row:row,
			col:col,
			colspan:colSpan,
			rowspan:rowSpan,
        });

		cell.onResize.subscribe(this.resizeCell, this);
		cell.onRemove.subscribe(this.removeCell, this);
		cell.onMaximize.subscribe(this.maximizeCell,this);

		this.layoutCells[cellIndex] = cell;
		
        this.add(cell);
		
        cell.add(content);

        //cell.onAttach();
		//cell.onDisplay();
		cell.onAdd(cell);

		return cell;
	};


	GridLayout.prototype.getCell = function(position){
			if(!position) position = [];

			var row = position[0]
			,	col = position[1]
			,	rowSpan = position[2]
			,	colSpan = position[3];

			//next empty cell is a default position of the cell
			if(row == null || col == null) {
				var position = this.getEmptyCell();
				row  = position.row;
				col = position.col;
				rowSpan = 1;
				colSpan = 1;
			}

			var _CellContainer = proxy(
			{	type:'CellContainer',
				row:row,
				col:col,
				colspan:colSpan,
				rowspan:rowSpan
			});

			var cellIndex = this.cellSequence++;

			var cell =  new _CellContainer({parent:this, index:cellIndex});

			cell.onResize.subscribe(this.resizeCell, this);
			cell.onRemove.subscribe(this.removeCell, this);
			cell.onMaximize.subscribe(this.maximizeCell,this);

			return cell;

	};

    /**
     * 
     */
	GridLayout.prototype.addCell = function(){
		var cell = addCell.apply(this,arguments);
		this.reflow();
		return cell;
	};

    /**
     * 
     */
    GridLayout.prototype.onDisplay = function(){
       _async.run(
           (function(){this.reflow();}).bind(this)
           );
        
    };


	/**
		Atempts to restore layout cell
	*/
	GridLayout.prototype.restoreCell = function(){
		restoreCell.apply(this,arguments);
		this.reflow();
	};

	/**
		Returns a collection of the layout cells
		@return {object} - indexed hash map, where index is an integer
											 indexes are not always sequential
	*/
	GridLayout.prototype.getCells = function(){
		return this.layoutCells;
	};

	/**
		Removes all cells from the layout
	*/
	GridLayout.prototype.clear = function(){
			var keys = Object.keys(this.layoutCells);

			for(var key in keys){
					var cell = this.layoutCells[keys[key]];
					cell.isAttached = false;
					cell.isShown = false;
                    this.getElement('root').node.removeChild(cell.concrete.dom);
			}
			this.layoutCells = Object.create(null);
	};

	GridLayout.prototype.maximizeCell = function(cell){
		console.log('Maximizing cell');
	};

	/**
		Removes single cell
		@param {CellContainer} cell - cell to be deleted
	*/
	GridLayout.prototype.removeCell = function(cell,isSoft){

		if(isSoft){
			cell.concrete.dom.style.display = 'none';
			cell.isSoftRemoved = true;

		}
		else {
			this.views.root.removeChild(cell.concrete.dom);
			cell.isAttached = false;
		}

		cell.isShown = false;

		delete this.layoutCells[cell.index];
		this.onRemoveCell(cell,isSoft);

	};


	GridLayout.prototype.getEmptyCell = function(){

		var to = this.grid.rows * this.grid.columns
		,	cells = this.layoutCells;

		var keys = Object.keys(this.layoutCells);

		for(var i=0; i < to; i++){
			var row = Math.floor(i / this.grid.columns)
			, 	col = i % this.grid.columns
			,	test = true;

			for(var j=0; j< keys.length; j++){
				var cell = cells[keys[j]];

				if(row >= cell.row && row <= (cell.row + cell.rowspan-1))
				if(col >= cell.col && col <= (cell.col + cell.colspan-1))
					test = false;

				if(col >= cell.col && col <= (cell.col + cell.colspan-1))
				if(row >= cell.row && row <= (cell.row + cell.rowspan-1))
					test = false;
			}

			if(test == true) return {row:row, col:col};
		}

		return null;
	};


	GridLayout.prototype.resizeCell = function(args){

		var cell = args.src;

		var cellPosition = this.getCellForPoint(args.mouse);
		var direction = args.direction;

		if(direction == bottom) {
			cell.rowspan = cellPosition.row - cell.row + 1; //at least a single row
		}

		if(direction == right) {
			cell.colspan = cellPosition.col - cell.col + 1; //at least a single row
		}


		if(direction == left) {
			cell.col = cellPosition.col; //at least a single row
		}

		if(direction == top) {

			var newSpan = cell.row + cell.rowspan - cellPosition.row;

			cell.row = cellPosition.row; //at least a single row

			if(newSpan >= 1) cell.rowspan = newSpan;
		}

		if(direction == move) {
			cell.col = cellPosition.col; //at least a single row
			cell.row = cellPosition.row; //at least a single row
		}

		this.reflow(cell.index);

	};

	GridLayout.prototype.maximizeCell = function(cell){
		cell.col = cell.row = 0;
		cell.rowspan = this.grid.rows;
		cell.colspan = this.grid.columns;

		this.reflow(cell.index);
	};

	GridLayout.prototype.setOutterMargin = function(margin){
		if(margin == null) {
			this.outerMargin = DEFAULT_OUTTER_MARGIN;
			return;
		}
		this.outerMargin = margin;
	};

	GridLayout.prototype.setMargin = function(margin){
		if(margin == null){
			this.margin = DEFAULT_MARGIN;
			return;
		}
		this.margin = margin;
	};

	GridLayout.prototype.reflow = function(cellIndex){
        if(!this.content || !this.content.default) return;

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.content.default;


		var grid = this.grid;

		/*tiled reflow*/
		var workarea = { clientWidth:  DOM.clientWidth  - 2 * outer_margin,
					 	 clientHeight: DOM.clientHeight - 2 * outer_margin};

		var cards = this.layoutCells;

		/* calculate unit size
	 	* based on client and grid size
	 	* */
		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
		var unitHeight = (workarea.clientHeight - (grid.rows - 1) * margin) / grid.rows;

	//	grid.clear();

		var keys = null;

		//get cell keys
		if(cellIndex != undefined) {
			keys = [cellIndex];
		} else {
			keys = Object.keys(cards);
		}

		for(var k = 0; k < keys.length; k++){
			var i = keys[k];
			//var style = cards[i].dom.style;

			/* panel position*/
			var l = outer_margin + (cards[i].col*unitWidth  + cards[i].col * margin);
			var t = outer_margin + (cards[i].row*unitHeight + cards[i].row * margin);

			/*panel size*/
			var w 	= cards[i].colspan * unitWidth + (margin * (cards[i].colspan -  1));
			var h 	= cards[i].rowspan * unitHeight + (margin * (cards[i].rowspan - 1));

			/* update grid */
		//	grid.fillGrid(cards[i].row, cards[i].col, cards[i].rowspan, cards[i].colspan, cards[i]);

			cards[i].reflow(l,t,w,h);
		}
	};

	/**
		@param {int} rows - number of rows in the grid, min 1
		@param {int} cols - number of cols in the grid, min 1
	*/
	GridLayout.prototype.setGridSize = function(rows, cols){

	};

	GridLayout.prototype.setGrid = function(grid){
		this.grid.setSize(grid);
		this.reflow();
	};


	GridLayout.prototype.getCellForPoint = function(p){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.elements.root.node;

		var offset = interaction.Positioning.abs(DOM);

		var grid = this.grid;

		var workarea = {dom: DOM,
						clientWidth:  DOM.clientWidth  - 2 * outer_margin,
						clientHeight: DOM.clientHeight - 2 * outer_margin};

		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
		unitWidth -= 2; /*border adjustment */

		var unitHeight = (workarea.clientHeight- (grid.rows - 1) * margin) / grid.rows;
		unitHeight -= 2;

		var p = {
			x:p.x-offset.x,
			y:p.y-offset.y
		};

		/* panel position*/
		var col = Math.floor((p.x - outer_margin) / (unitWidth  + margin));
		var row = Math.floor((p.y - outer_margin) / (unitHeight + margin));

		return {row:row, col:col};
	};


	//component factory
    var scope = {};
    var componentFactory = component.ComponentFactory(require,scope);

   	var CellContainerComponent =  componentFactory.define('CellContainer:gridlayout.html',CellContainer);
   	var GridLayoutComponent = componentFactory.define('GridLayout:gridlayout.html',GridLayout);


	return  {
		Grid : Grid,
        CellContainer : CellContainerComponent,
		GridLayout : GridLayoutComponent
	}

});
