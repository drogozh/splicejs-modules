define(
[
  '/{splice.modules}/splice.network.js',
  'loader'
],
function(networking,loader){
  var http = networking.http
  ,   ImportSpec = loader.ImportSpec;


  /*
  ----------------------------------------------------------
    HTML File Handler
  */
  function HtmlSpec(fileName){
    this.fileName = fileName;
  }
  HtmlSpec.prototype = new ImportSpec();
  HtmlSpec.execute = function(){
    this.isProcessed = true;
  }

  var htmlHandler = {
      importSpec:function(fileName){
        return new HtmlSpec(fileName);
      },
      load:function(loader, spec){
        http.get({
            url: spec.fileName,
            onok:function(response){
              loader.add(spec);

              spec.exports = document.createElement('span');

              var cStart = /<sjs-component(?:.*?)>/gi
              ,   cEnd = /<\/sjs-component>/gi

              //var //componentRegex = /(?:<sjs-component>)(.|[\n\r\t\s\f])*(?:<\/sjs-component>)/gi
              //    /<sjs-component(?:.*?)>(.*|[\n\r\t\s\f]*)<\/sjs-component>/
              //    /<sjs-component(?:.*?)>((?:.|[\n\r\t\s\f])*)<\/sjs-component>/
              
              ,   match = null;  
              while((match = cStart.exec(response.text))){
                var end = cEnd.exec(response.text);
               // log.info(match);
              }

              spec.exports.innerHTML = response.text;
              setTimeout(function(){
                loader.notify(spec);
                //loader.onitemloaded(spec.fileName);
              },1);
              
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
