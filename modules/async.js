define(function(){

    function _isfn(value) {
        return typeof value === 'function'
    }

    //todo: add loop JOIN method to put them on the same timer
    function _loop(from, to, pageSize, pageTimeOut, oncallback, oncomplete, onpage){
		var page_size = 20
		,   length = 0
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
               _loop(from, to, pageSize, pageTimeOut, oncallback, oncomplete, onpage);
            }
        }
    }

    function _peek(stack){
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
    function Iterator(obj, children, oncallback, pageSize, delay, oncomplete, onpage){
        if(!delay || delay <= 0 ) delay  = 1;
        if(!pageSize || pageSize <= 0 ) pageSize = 10000;
        
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
                var pk = _peek(frameStack)
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
                this.next.priorResult = this.currentResult;
                this.next.invoke(this.result);
            }
            return this.next;            
        },
        invoke:function(arg){
            var observer = 
            this.worker({
                result:this.priorResult,
                ok:(function(){
                    this.isReady = true;
                    this.currentResult = 'ok';
                    this.result = this.observer.ok.apply(this.observer, arguments);
                    if(typeof(this.observer.complete) === 'function'){
                        this.observer.complete(this.result);
                    } 
                    if(this.next) {
                        this.next.priorResult = this.currentResult;
                        this.next.invoke(this.result);
                    }
                }).bind(this),
                fail:(function(){
                    this.isReady = true;
                    this.currentResult = 'fail';
                    this.result = this.observer.fail.apply(this.observer, arguments);
                    if(typeof(this.observer.complete) === 'function'){
                        this.observer.complete(this.result);
                    } 
                    if(this.next) {
                        this.next.priorResult = this.currentResult;
                        this.next.invoke(this.result);
                    }
                }).bind(this)
            },arg);            
            return this;
        }
    };

    // Promise (like) object
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    // supports only prototype methods, static APIs as described in the MDN reference is not included

    var PROMISE_STATE = {
        PENDING :   1,
        FULFILLED:  2,
        REJECTED:   3
    };
    
    function _Promise(worker) {
        this._state = PROMISE_STATE.PENDING;
        this._result = null;

        worker(
            (function resolve(result) {
                this._state = PROMISE_STATE.FULFILLED;
                this._result = result;
                if(_isfn(this._handler))
                    this._handler(this._result, this._state);
            }).bind(this), 
            (function reject(reason) {
                this._state = PROMISE_STATE.REJECTED;
                this._result = reason;
                if(_isfn(this._handler))
                    this._handler(this._result, this._state);
            }).bind(this)
        );
    }

    _Promise.prototype.then = function then(onFulfilled, onRejected) {
        return new _Promise((function(resolve, reject) {
           this._handler = _handlePromise.call(this,function(result, state) {
                var _result = null; 
                switch(state){
                    case PROMISE_STATE.FULFILLED:
                        _result = onFulfilled(result);
                        if(_result instanceof _Promise) {
                            _result.then(resolve);
                            return;        
                        }
                        resolve(_result);
                        break;
                    
                    case PROMISE_STATE.REJECTED:
                        _result = _isfn(onRejected) ? onRejected(result) : null;
                        if(_result instanceof _Promise) {
                            _result.reject(resolve);
                            return;        
                        }
                        reject(_result !=null ? _result : result);
                        break;
                }
            })
        }).bind(this));
    };

    _Promise.prototype['catch'] = function (onRejected) {
       return new _Promise((function(resolve, reject) {
           this._handler = _handlePromise.call(this,function(result, state) {
                var _result = onRejected(result);
                if(_result instanceof _Promise) {
                    _result.catch(resolve);
                    return;        
                }
                reject(_result != null ? _result : result);
            })
        }).bind(this));
    };

    function _handlePromise(callback) {
        if(this._state != PROMISE_STATE.PENDING ) {
            callback(this._result, this._state);
            return;
        }
        return callback;
    }

    return {
        loop: asyncLoop,
        iterator: asyncIterator,
        run: execute,
        lapse: function(fn) { 
            execute(fn,16);    // delay 1/60s ~ 16.7ms x 1frame 
        },      
        soon: function(fn) { 
            execute(fn,4*16)   // delay 1/60s ~ 16.7ms x 4frames
        },    
        defer: defer,
        promise: function(worker) {
            return new _Promise(worker);
        }
    }
});
