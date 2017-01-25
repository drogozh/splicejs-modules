define([	
    'require',
    '{splice.modules}/event',
    '{splice.modules}/component.loader'
],function(require,event,loader){

    function StyleProvider(){
        event.attach(this, {
            onStyle:event.MulticastEvent
        });
    }

    StyleProvider.prototype.setTheme = function(name){
        this.onStyle(name);
    }

    StyleProvider.prototype.applyStyle = function(fileName){
        loader.applyStyleSheet(fileName);
    }

    return new StyleProvider();
});