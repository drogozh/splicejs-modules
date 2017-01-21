define([
    'require',
    '{splice.modules}/inheritance',
    '{splice.modules}/component',
    {
        ScrollPanel:'{splice.controls}/scrollpanel'
    },
    '{splice.modules}/async',
    '!treeview.css',
],function(require,inheritance,component,controls){
	
	var Class = inheritance.Class
    ,	factory = component.ComponentFactory(require,controls);


    var Tree = factory.define('Tree:treeview.html',Class(function Tree(){
    }).extend(component.ComponentBase));

    var Node = factory.define('TreeNode:treeview.html',Class(function TreeNode(){
    }).extend(component.ComponentBase));


    var Leaf = factory.define('TreeLeaf:treeview.html',Class(function TreeLeaf(){
    }).extend(component.ComponentBase));


	var TreeView = Class(function TreeView(args){
         collectTreeViewArgs.call(this,args);
         this.tree = new Tree();

	}).extend(component.ComponentBase);


    TreeView.prototype.dataIn = function(data){
        
        for(var i=0; i<data.length; i++){
            var comp = data[i][this.childProp] ? new Node(): new Leaf();
            plantTree.call(this,data[i][this.childProp],comp);
            
            if(this.itemTemplate){ 
                var c = new this.itemTemplate(this);
                c.applyContent(data[i]);
                comp.set(c);
            } else {
                comp.set(data[i]);
            }
            this.tree.add(comp);
        }
        
        this.set(this.tree);
        var scrollPanel = this.getInclude('scrollPanel');
        scrollPanel.reflow();
    };


    function plantTree(data,parent){
         if(!data) return;
         for(var i=0; i<data.length; i++){
            var comp = data[i][this.childProp] ? new Node(): new Leaf();
            
            if(this.itemTemplate){ 
                var c = new this.itemTemplate(this);
                c.applyContent(data[i]);
                comp.set(c);
            } else {
                comp.set(data[i]);
            }


            plantTree.call(this,data[i][this.childProp],comp);
            parent.add(comp,'children');
        }
        return parent;
    }


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