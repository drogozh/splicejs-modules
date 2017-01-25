define([
    'require',
    '{splice.modules}/inheritance',
    '{splice.modules}/component',
    {
        ScrollPanel:'{splice.controls}/scrollpanel'
    },
    '{splice.modules}/async',
    '{splice.modules}/event',
    '{splice.modules}/view',
    '{splice.controls}/styleprovider',
    '!treeview.css',
],function(require,inheritance,component,controls,_async,event,Element){
	
	var Class = inheritance.Class
    ,	factory = component.ComponentFactory(require,controls);


    var Tree = factory.define('Tree:treeview.html',Class(function Tree(){
    }).extend(component.ComponentBase));

    var Leaf = factory.define('TreeLeaf:treeview.html',Class(function TreeLeaf(){
        this.dataItem = null;    
    }).extend(component.ComponentBase));

    Leaf.prototype.dataIn = function(data){
        this.dataItem = data;
    }

    /**
     * 
     * 
     */
    var Node = factory.define('TreeNode:treeview.html',Class(function TreeNode(){
        this.isExpanded = true;    
    }).extend(Leaf));

    Node.prototype.collapse = function(){
        //style collapsed node
        this.getElement('expandor')
            .replaceClass('-sc-tree-node-expanded','-sc-tree-node-collapsed');

        //hide child elements
        this.getElement('treeRoot')
            .appendClass('collapsed');
    }

    Node.prototype.expand = function(){
        //style collapsed node
        this.getElement('expandor')
            .replaceClass('-sc-tree-node-collapsed','-sc-tree-node-expanded');
        //hide child elements
        this.getElement('treeRoot')
            .removeClass('collapsed');
    }

    Node.prototype.toggle = function(){
        this.isExpanded = !this.isExpanded;
        if(this.isExpanded == true) this.expand();
        else this.collapse();
    }


    /** TreeView component view model */
	var TreeView = Class(function TreeView(args){
        collectTreeViewArgs.call(this,args);
        this.tree = new Tree();
        this.nodes = [];
        //        
        event.attach(this,{
            onItemSelected: event.MulticastEvent
        })	
    }).extend(component.ComponentBase);


    TreeView.prototype.onLoaded = function(){
        var root = this
            .getComponent('scrollPanel')
            .getElement('root');

        event.attach(root, {
            onmousedown:Element.DomMulticastStopEvent
        }).onmousedown.subscribe(_treeViewItemClicked,this);
    }


    function _treeViewItemClicked(args){
        //locate node view model
        var node = component.locate(args.source,Leaf);
        if(!node) return;

        //we want to toggle node
        if(node instanceof Node && 
            args.source == node.getElement('expandor').node) {
            node.toggle();
            //update layout        
            this.getComponent('scrollPanel').reflow();
            return;
        }

        //we want to select node
        //determine the selected item
        this.onItemSelected(node.dataItem);

    
    }


    TreeView.prototype.dataIn = function(data){
        if(this.dataIterator) this.dataIterator.stop();

        this.dataIterator = 
        _async.iterator(data).recursive(
            // child selector
            (function(d){
                return d[this.childProp];
            }).bind(this),

            // onchild action
            (function(node,parent,n,np){
                
                var parent = this.nodes[np];
                var comp =   this.nodes[n];

                if(!comp) {
                    comp = node[this.childProp] ? new Node(): new Leaf();
                
                    if(!parent) this.tree.add(comp);
                    else parent.add(comp,'children');
                }

                if(this.itemTemplate){ 
                    var c = new this.itemTemplate(this);
                    c.applyContent(node);
                    comp.set(c);
                } else {
                    comp.set(node);
                }
                comp.dataIn(node);
                this.nodes[n] = comp;


            }).bind(this),
        
            //oncomplete action
            function(){
                console.log('complete');
            },

            //on page action, good place to reflow layout
            (function(){
                this.getComponent('scrollPanel').reflow();
            }).bind(this));

        this.set(this.tree);
    };




    function collectTreeViewArgs(args){
        if(!args) return;
        this.childProp = args.childCollection
        this.itemTemplate = args.itemTemplate;
    }

	function renderTree(data){
		var str = parseTree(data);
		this.ref.tree.dataIn(str);
	}


	function breakout(node){
		return new Array(
				node.substr(0,node.indexOf('|')),
				node.substr(node.indexOf('|')+1)
		);
	};


	function parseTree(json, filter){

		/*this is array, also root node*/
		var str = '';
		for(var i=0; i < json.length; i++){

			if(typeof json[i] == 'object') str += parseTree(json[i],filter);
			else {
				var b = breakout(json[i]);
				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter)
				str += '<li><div id="'+b[0]+'" class="-splicejs-tree-item">'+b[1]+'</div></li>';
			}
		}

		if(json.length > 0) return str;

		/*parse JSON tree representation */
		for(prop in json ){
			if(typeof json[prop] == 'object' ) {
				var b = breakout(prop);
				var tmp = '<li><div id="'+b[0]+'" class="-splicejs-tree-item">'+
					'<div class="-sc-tree-expandor -sc-tree-node-expanded"></div>'+b[1]+'</div><ul>';
				var subitems = parseTree(json[prop],filter);

				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter || subitems.length > 5)
					str += tmp + subitems + '</ul></li>';
			}
		}

		return str;
	}

	controls.TreeView = factory.define('TreeView:treeview.html',TreeView);
   
    return controls.TreeView

});
