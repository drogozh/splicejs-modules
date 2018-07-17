define(function(){
    window.onerror = function(error,a,b,c,d,e,f,g){
        console.log(error);
        return false;
    }
});