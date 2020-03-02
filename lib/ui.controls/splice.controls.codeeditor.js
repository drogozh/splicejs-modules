$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js' },
	{ Networking  : '/{$jshome}/modules/splice.network.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.codeeditor.css',
	'splice.controls.codeeditor.html'
],
definition:function(){
	
	var scope = this
	,	sjs = this.imports.$js;
	
	var
		imports = scope.imports
	;
	var
		Class = imports.Inheritance.Class
	,	HttpRequest = imports.Networking.HttpRequest
	,	UIControl = imports.SpliceJS.UI.UIControl
	;

	var CodeEditor = Class(function CodeEditorController(){
		this.base();
		var location  = this.file;

		var self = this;

		this.lines = [];

		HttpRequest.get({
			url:location,
			onok:function(result){
				self.displayCode(result.text);
			}
		});
	}).extend(UIControl);

	CodeEditor.prototype.displayCode = function(code){

		//convert indentations to HTML
		this.lines = generateLines.call(this,code);

		for(var i=0; i< this.lines.length; i++){
			this.elements.root.appendChild(this.lines[i]);
		}
	};


	function applyTabulation(code, target){
		//count number of tabs or spaces
		var tabs = 0;
		var c = code[0];

		while(c == ' ' || c == '\t'){
			c = code[tabs++];
		}

		var spaces = '';
		for(var i=0; i<tabs; i++){
			spaces += '\u00A0';
		}

		if(!spaces || spaces  == '') return;
		target.appendChild(document.createTextNode(spaces));
	}

	function generateLines(code){

		var lines = [];

		var classNames = ['even', 'odd' ];
		var lineNum = 0;

		var accumulator = '';
		for(var i=0; i<code.length; i++){
			var c = code[i++];
			while(c!='\n' && c) {
				accumulator = accumulator + c;
				c = code[i++];
			}

			var line = document.createElement('div');
			line.className = 'line ' + classNames[lineNum % 2];

			lineNum ++;


			if(this.lineNumbers) {
				var linen = document.createElement('div');
				linen.className="linenumber";
				linen.innerHTML = lineNum + '.';
				line.appendChild(linen);
			}


			applyTabulation(accumulator,line);

			line.appendChild(document.createTextNode(accumulator));
			lines.push(line);
			accumulator = '';
			i--;
		}

		return lines;
	}

}

});
