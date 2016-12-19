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
        var root = new document.createElement('div');
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
              if(/label.html$/.test(spec.fileName)) 
                delay = 2000;

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
    this.isProcessed = true;
  };

  var cssHandler = {
    importSpec:function(fileName){
      return new CssSpec(fileName);
    },
    load:function(loader,spec){
      loader.add(spec);

      var linkref = document.createElement('link');

      linkref.setAttribute("rel", "stylesheet");
      linkref.setAttribute("type", "text/css");
      linkref.setAttribute("href", spec.fileName);

      //linkref.onreadystatechange
      /*
      * Link ref supports onload in IE8 WTF????
      * as well as onreadystatechange
      * having an assigment to both will trigger the handler twice
      *
      * */
      var head = document.head || document.getElementsByTagName('head')[0];
      
      /*
      linkref.onload = function(){
        if(!linkref.readyState || linkref.readyState == 'complete') {
        //	URL_CACHE[filename] = true;
          loader.onitemloaded(filename);
        }
      };
      */
      //lets not wait for CSS to load since CSS are processed by the browser
      setTimeout(function(){
        //loader.onitemloaded(spec.fileName);
         loader.notify(spec);
      },1);
      head.appendChild(linkref);
     
      
    }
  };

  try {
    if(!JSON) throw 'No JSON'; 
  }
  catch(ex){
    JSON = {parse:function(){}};
  }

  loader.addHandler('.css',cssHandler);
  loader.addHandler('.html',htmlHandler);
 

});
