define(function(){

//todo: add loop JOIN method to put them on the same timer
    function loop(from, to, pageSize, pageTimeOut, oncallback, oncomplete, onpage){
		var page_size = 20
		,	length = 0
        ,   page_time_out = 1;

        var length = to - from + 1;

		if(pageSize) page_size = pageSize;
        if(pageTimeOut) page_time_out = pageTimeOut;

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
			setTimeout(fn,page_time_out);
		}

		fn();
	};

    /**
     * 
     * 
     */
    function asyncLoop(from, to, pageSize, pageTimeOut){
        return {
            for:function(oncallback,oncomplete,onpage){
               loop(from, to, pageSize, pageTimeOut, oncallback, oncomplete, onpage);
            }
        }
    }


    function execute(fn,delay){
        if(delay == null || delay <= 0) delay = 1;
        setTimeout(fn,delay);
    }


return {
	loop:asyncLoop,
    exec:execute
}


});
