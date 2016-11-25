$js.module({
definition:function(){
var scope = this;

//todo: add loop JOIN method to put them on the same timer
    var asyncLoop = function asyncLoop(from, to, pageSize, oncallback, oncomplete, onpage){
		var page_size = 20
		,	length = 0;

        var length = to - from + 1;

		if(pageSize) page_size = pageSize;

		var	pages = Math.floor(length / page_size) + ( (length % page_size) > 0 ? 1 : 0)  
		,	count = {p:0};

		var fn = function(){
			if(count.p >=  pages) {
				if(typeof oncomplete === 'function' ) oncomplete();
				return;
			}
			var start = from + page_size * count.p
			,	end  = start + page_size;
			for(var i = start;
					i < end && i < length;
					i++ ) {
				if(!oncallback(i)) return;
			}
			count.p++;
			if(typeof onpage === 'function') onpage();
			setTimeout(fn,1);
		}

		fn();
	};


//async promise
function AsyncPromise(exer,name,pageSize){
	this.onok = [];
	this.onfail = [];
	this.scope = scope;
	this.name = name;
	this.pageSize = pageSize != null?pageSize : 100;
	//resolve
	exer((function(okResult){
		//ok
		this.okResult = okResult;
		if(this.onok != null) {
			
			asyncLoop(0,this.onok.length-1,this.pageSize, (function(i){
				this.okResult = this.onok[i](this.okResult);
				return true;
			}).bind(this));

			// for(var i=0; i<this.onok.length; i++) {
			// 	this.okResult = this.onok[i](this.okResult);
			// }
		}
		else this.okResult = okResult;
	}).bind(this),
	//reject 
	(function(failResult){
		//fail
		if(this.onfail != null) this.onfail(failResult);
		else this.failResult = failResult;
	}).bind(this));
}
AsyncPromise.prototype.then = function(fn){
	this.onok.push(fn);
	if(this.okResult !== undefined) 
		this.okResult = fn(this.okResult);
	
	
	return this;
}
AsyncPromise.prototype['catch'] = function(fn){
	this.onfail = fn;
	if(this.failResult !== undefined) fn(this.failResult);
	return this;
}


    scope.exports(
        asyncLoop,
		AsyncPromise
    );

}}
);
