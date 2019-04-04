define([
    'loader',
    'network',
],function(loader, network){
    'use strict'
    
    
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




    loader.addHandler('.html',function(url,callback){
        network.http.get({
            url: url
        })({
            ok:function(response){
                var node = document.createElement('span');
                node.innerHTML = response.text;
                var collection = new TemplateCollection(node);
                callback(collection.templates);
            }
        });
    });
});