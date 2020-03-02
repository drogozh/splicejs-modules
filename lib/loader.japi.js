define([
    'loader',
    'network',
],function(loader, network){
    'use strict'
    loader.addHandler('.japi',function(url,callback){
        var url = url.substring(0,url.lastIndexOf('.'));
        network.http.get({
            url: url
        })({
            ok:function(response){
                callback(response);
            }
        });
    });
});