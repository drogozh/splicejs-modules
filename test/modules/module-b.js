define([
    'require',
    'module-a',
    'loader'
],function(r,m,l){
    return {
        result:true && m.result()
    }
}); 