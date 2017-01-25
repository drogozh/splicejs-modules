define(
[
  '/{splice.modules}/network.js',
  'loader'
], function(networking,loader){

  var http = networking.http
  ,   ImportSpec = loader.ImportSpec;



  /*
  ----------------------------------------------------------
    HTML File Handler
  */

  function Template(node){
    this.node = node;

  }


  function TemplateCollection(node){
    this.templates = {};
    var nodes = node.querySelectorAll('template');
    for(var i=0; i<nodes.length; i++){
      var node = nodes[i];
      var attr = node.getAttribute('sjs-name');
      if(!attr) continue;

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
      

      this.templates[attr] = new Template(node);
    }
  }


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
            url: spec.fileName,
            onok:function(response){
              spec.innerHTML = response.text;
              var delay = 1;
              if(/buttons.html$/.test(spec.fileName) || 
                /treeview.html$/.test(spec.fileName))
                delay = 1;
              setTimeout(function(){
                loader.notify(spec);
              },delay);
              
            }
        });
      }
  };

  /*
  ----------------------------------------------------------
    CSS File Handler
  */
  function CssSpec(fileName){
    this.fileName = fileName;
  }
  CssSpec.prototype = new ImportSpec();
  CssSpec.prototype.execute = function(){
    this.exports = {
      fileName:this.fileName
    };
    this.isProcessed = true;
  };

  var cssHandler = {
    importSpec:function(fileName){
      return new CssSpec(fileName);
    },
    load:function(loader,spec){
      loader.add(spec);

      _applyStyleSheet(spec.fileName);

      setTimeout(function(){
        //loader.onitemloaded(spec.fileName);
         loader.notify(spec);
      },1);
    }
  };

  function _applyStyleSheet(fileName){
    var linkref = document.createElement('link');

      linkref.setAttribute("rel", "stylesheet");
      linkref.setAttribute("type", "text/css");
      linkref.setAttribute("href", fileName);

      var head = document.head || document.getElementsByTagName('head')[0];
            //lets not wait for CSS to load since CSS are processed by the browser
      head.appendChild(linkref);

  }



  loader.addHandler('.css',cssHandler);
  loader.addHandler('.html',htmlHandler);
 

  return {
    applyStyleSheet:_applyStyleSheet
  }

});
