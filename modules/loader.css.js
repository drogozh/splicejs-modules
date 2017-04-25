define([
    'loader'
], function(loader){
    
    var ImportSpec = loader.ImportSpec;

    //  CSS File Handler  
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
        head.appendChild(linkref);
    }

    loader.addHandler('.css',cssHandler);

    return {
        applyStyleSheet:_applyStyleSheet
    }
});