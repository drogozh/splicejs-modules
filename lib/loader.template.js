define([
    'loader',
    'network',
],function(loader, network){

    var http = network.http
    ,   ImportSpec = loader.ImportSpec;

    // HTML template handler
    function Template(node,name,key){
        this.node = node;
        this.name = name;
        this.key = key;
    }

    function TemplateCollection(node){
        this.templates = {};
        var nodes = node.querySelectorAll('template');
        
        for(var i=0; i<nodes.length; i++){
            var node = nodes[i];
            var name = node.getAttribute('sjs-name');
            var key = node.getAttribute('sjs-key');
            if(!key) key = "default";
            if(!name) continue;

            if(node.tagName == 'TEMPLATE' && node.content){
                node = node.content;
            }

            //isolate node
            if(node.children.length == 1){ 
                node = node.children[0];
            }
            else {
                var root = document.createElement('div');
                var children = node.children;
                for(var i=0; i<children.length; i++){
                    root.appendChild(children[i]);
                }
                node = root;
            }  
            //this.templates[attr] = new Template(node);
            this.add(name, new Template(node,name,key));
        }
    }

    TemplateCollection.prototype.add = function add(key,template){
        var list = this.templates[key];
        if(!list){
            this.templates[key] = list = [];
        }
        this.templates[key].push(template);
    };

    function HtmlSpec(fileName){
        this.fileName = fileName;
    }
  
    HtmlSpec.prototype = new ImportSpec();
    HtmlSpec.prototype.execute = function(){

        var node = document.createElement('span');
        node.innerHTML = this.innerHTML;

        var collection = new TemplateCollection(node);
        this.exports = collection.templates;
        this.isProcessed = true;
    }

    var htmlHandler = {
        importSpec:function(fileName){
            return new HtmlSpec(fileName);
        },
        load:function(loader, spec){
            loader.add(spec);
            http.get({
                url: spec.fileName
            })({
                ok:function(response){
                    spec.innerHTML = response.text;
                    loader.notify(spec);
                }
            });
        }
    };
  
    loader.addHandler('.html',htmlHandler);

});