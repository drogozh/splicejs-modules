define([
    'loader'
], function(loader){
    'use strict'
    loader.addHandler('.css',function(url,callback){
        var link = document.createElement('link');
        link.setAttribute("rel", "preload");
        link.setAttribute("href", url);
        link.setAttribute("as", "style");

        var linkref = document.createElement('link');
        linkref.setAttribute("rel", "stylesheet");
        linkref.setAttribute("type", "text/css");
        linkref.setAttribute("href", url);
        var head = document.head || document.getElementsByTagName('head')[0];
        
        head.appendChild(link);
        head.appendChild(linkref);
        
        callback('css');
    });
});