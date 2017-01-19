define([
    'require',
    '{splice.modules}/inheritance',
    '{splice.modules}/component',
    {
        ScrollPanel:'{splice.controls}/scrollpanel'
    },
    '!treeview.css',
],function(require,inheritance,component,controls){
	
	var Class = inheritance.Class
    ,	factory = component.ComponentFactory(require,controls);

	var TreeView = Class( function TreeView(){
	}).extend(component.ComponentBase);


    TreeView.prototype.dataIn = function(data){

    };



	var Tree = Class(function Tree(){
	}).extend(component.ComponentBase);



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
    controls.Tree = factory.define('Tree:treeview.html',Tree);

    return controls.TreeView

});
