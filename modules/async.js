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

    function peek(stack){
        var frame = stack[stack.length-1];
        if(!frame) return {node:null, n:-1};
        return {
            node:frame.obj[frame.keys[frame.count-1]],
            id:frame.id
        }
    }

    /**
     * oncallback(currenNode, parentNode, currentNodeId, parentNodeId)
     * 
     */
    function Iterator(obj, children, oncallback, pageSize, delay,oncomplete,onpage){
        if(!delay || delay <= 0 ) delay  = 1;
        if(!pageSize || pageSize <=0 ) pageSize = 10000;
        
        this.frameStack = [];

        this.p = {f:{
            obj:obj,
            keys:Object.keys(obj),
            count:0,
            id:0
        },n:0};

        this._stop = false;

        var fn = (function(){
            var p = this.p;
            var frameStack = this.frameStack;
            do {
                if(this._stop) return;
                if(!p.f) { 
                    //iteration is complete
                    if(typeof oncomplete == 'function') oncomplete();
                    return; 
                }
                
                var key = p.f.keys[p.f.count];
                var pk = peek(frameStack)
                oncallback(p.f.obj[key],pk.node,p.n,pk.id);
                p.f.id = p.n;
                p.f.count++;
                p.n++;
                
                //decend into children
                var ch = children(p.f.obj[key]);
                if(ch != null) {
                    frameStack.push(p.f);
                    p.f = {
                        obj:ch,
                        keys:Object.keys(ch),
                        count:0,id:0
                    };    
                }

                while(p.f && p.f.count >= p.f.keys.length){
                    p.f = frameStack.pop();
                }

            } while (p.n % pageSize > 0 && p.f && p.f.count <= p.f.keys.length);
            if(typeof onpage == 'function') onpage();
            setTimeout(fn,delay);
        }).bind(this); 

        setTimeout(fn,1);
        return this;    
    }

    Iterator.prototype.stop = function(){
        this._stop = true;    
    }

    /** 
     * 
     * 
     */
    function asyncIterator(obj){
        return {
            for:function(){},
            recursive:function(children,oncallback,oncomplete,onpage){
              return new Iterator(obj,children,oncallback,50,1,oncomplete,onpage);  
            }
        }
    }

    // Delayed execution 
    function execute(fn,delay){
        if(delay == null || delay <= 0) delay = 1;
        setTimeout(fn,delay);
    }

    
    // Chained Promise-like deffered execution
    function defer(worker,observer){
        return new Deferral(worker,observer).invoke();
    }

    function Deferral(worker, observer){
        // new constructor is called         
        this.observer = observer;
        this.worker = worker;
        this.isReady = false;
    }

    Deferral.prototype = {
        then:function(worker, observer){
            this.next = new Deferral(worker,observer);
            if(this.isReady) {
                this.next.prior = this.isOkState;
                this.next.invoke(this.result);
            }
            return this.next;            
        },
        invoke:function(arg){
            var observer = 
            this.worker({
                prior:this.prior,
                ok:(function(arg){
                    this.isReady = true;
                    this.isOkState = true;
                    this.result = this.observer.ok(arg);
                    if(typeof(this.observer.complete) === 'function'){
                        this.observer.complete(this.result);
                    } 
                    if(this.next) {
                        this.next.prior = this.isOkState;
                        this.next.invoke(this.result);
                    }
                }).bind(this),
                fail:(function(arg){
                    this.isReady = true;
                    this.isOkState = false;
                    this.result = this.observer.fail(arg);
                    if(typeof(this.observer.complete) === 'function'){
                        this.observer.complete(this.result);
                    } 
                    if(this.next) {
                        this.next.prior = this.isOkState;
                        this.next.invoke(this.result);
                    }
                }).bind(this)
            },arg);            
            return this;
        }
    };

return {
	loop:asyncLoop,
    iterator:asyncIterator,
    run:execute,
    lapse:function(fn){execute(fn,16)},      //delay 1/60s ~ 16.7ms x 1frame
    soon:function(fn){execute(fn,4*16)},    //delay 1/60s ~ 16.7ms x 4frames
    defer:defer
}


});
