define([	
    'require',
    '{splice.modules}/event',
    '{splice.modules}/loader.css'
],function(require,event,loader){

    function ThemeProvider(){
        event.attach(this, {
            onStyle:event.MulticastEvent
        });
    }

    ThemeProvider.prototype.setTheme = function(name){
        this.onStyle(name);
    }

    ThemeProvider.prototype.applyStyle = function(fileName){
        loader.applyStyleSheet(fileName);
    }

    return new ThemeProvider();
});