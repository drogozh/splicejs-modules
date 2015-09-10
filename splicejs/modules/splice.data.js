/* global sjs */
sjs({
definition:function(sjs){

	var mixin = sjs.mixin
	,	Class = sjs.Class;

	var DataStep = function DataStep(dowork, issource){
		mixin(this,{
			input : null,
			next : [],
			data : null,
			issource: issource
			}
		);
		this.dowork = dowork;
	};	
	DataStep.prototype = {
		run:function(args){
			var in_data = null;
			if(this.issource) in_data = this.data;
			else
				in_data = this.input.data;

			this.data = this.dowork(in_data, args);
			for(var i=0; i< this.next.length; i++){
				this.next[i].run();
			}
		},
		add:function(step){
			this.next.push(step);
			step.input = this;
			return step;
		},
		setdata:function(data){
			this.data = data;
		}
	};

	/*
		Iterator
	*/
	function Iterator(callback){
		this.fn = (typeof callback === 'function') ? callback : function(item){return item;};
	};

	//returns array
	Iterator.prototype.current = function(){
		var result = [];
		this.iterate(function(v,k){
			result.push(v);
		})
		return result;
	};

	Iterator.prototype.iterate = function(callback){
		throw "Abstract method: Iterator.prototype.iterate(fn) implementation is not provided";
	};


	/**
	 *
	 */
	var NumericIterator = Class.extend(Iterator)(function NumericIterator(n,callback){
		this.super(callback);
		this.n = n;
		this.current = 0;
	});

	/**
	 * Returns false when last item is reached
	 */
	NumericIterator.prototype.next = function(callback){
		if(this.current == this.n) return false;
		callback(this.fn(this.current++));
		if(this.current == this.n) return false;
		return true;
	};


	NumericIterator.prototype.iterate = function(callback){
		callback = callback ? callback : function(){};

		for(var i=0; i<this.n; i++){
			callback(this.fn(i));
		}
	};

	/**
	 *
	 */
	var NestedIterator = Class.extend(Iterator)(function NestedIterator(iterator,callback){
		this.super(callback);
		this.iterator = iterator;
	});

	NestedIterator.prototype.next = function(callback){
		var self = this;
		return this.iterator.next(function(item){
			callback(self.fn(item));
		});
	};

	NestedIterator.prototype.iterate = function(callback){
		var self = this;
		this.iterator.iterate(function(){
			arguments[0] = self.fn.apply(self,arguments);
			callback.apply(this,arguments);
		});
	};

	/**
	 * Iterates over array elements
	 */
	var ArrayIterator = Class.extend(Iterator)(function ArrayIterator(array,callback){
		this.super(callback);
		this.array = array;
		this.position = 0;
	});

	ArrayIterator.prototype.next = function(callback){
		if(this.position >= this.array.length) return false;
		callback(this.fn(this.array[this.position]), this.position);
		this.position++;
		if(this.position >= this.array.length) return false;
		return true;
	};

	ArrayIterator.prototype.iterate = function(callback){
		if(typeof callback !== 'function') return;
		for(var i=0; i< this.array.length; i++){
			callback(this.fn(this.array[i]),i);
		}
	};




	/**
	 * Iterates over object properties
	 */
	var ObjectIterator = Class.extend(Iterator)(function ObjectIterator(obj, callback){
		this.super(callback);
		this.obj = obj;
		this.keys = Object.keys(obj);
		this.position = 0;
	});

	ObjectIterator.prototype.next = function(callback){
		if(this.position >= this.keys.length) return false;
		var key = this.keys[this.position];
		callback(this.fn(this.obj[key]),key);
		this.position++;
		if(this.position >= this.keys.length) return false;
	};

	ObjectIterator.prototype.iterate = function(callback){
		for(var i=0; i< this.keys.length; i++){
			var key = this.keys[i];
			callback(this.fn(this.obj[key]),key);
		}
	};


	/*
		Paginator
	*/
	var Paginator = function Paginator(data, pageSize, startPage){

		this.data = data;

		this.pageSize = pageSize || 2 ;

		this.currentPage = -1;

		this.maxPage = Math.floor(this.data.length / pageSize) +
			( (this.data.length % pageSize) / (this.data.length % pageSize)) ;

		this.minPage = -1;

		if(startPage > 0) this.currentPage = startPage-1;

		this.next();
	};


	function _page(){
		this.current = [];

		if(this.currentPage > this.maxPage) {
			this.currentPage = this.maxPage;
			return this;
		}

		if(this.currentPage < this.minPage) {
			this.currentPage = this.minPage;
			return this;
		}

		for(var i=0; i<this.pageSize; i++){
			var idx = this.currentPage * this.pageSize + i;

			// boundary check
			if(idx > this.data.length-1) {
				break;
			}
			if(idx < 0) {
				break;
			}

			this.current.push(this.data[idx]);
		}
		return this;
	};

	Paginator.prototype = {
		hasNext : function(){
			/* compare next page idex to last element's index */
			if( (this.currentPage + 1) * this.pageSize > (this.data.length-1) ) return false;
			return true;
		}
		,
		next : function(){
			this.currentPage++;
			return _page.call(this);
		}
		,
		prev : function(){
			this.currentPage--;
			return _page.call(this);
		},
		to:function(pageNumber){
			this.currentPage = pageNumber;
			return _page.call(this);
		},
		pages:function(){
			return this.maxPage;
		}
	};


	var Frame = function Frame(data, size, step){
		if (size == undefined) throw 'The frame size is required';

		this.data = data;
		this.size = size;
		this.step = step || Math.ceil(this.data.length * 0.2);

		this.cursor = (-1)*this.step;

		if (this.step > this.size)
		throw 'The step should not exceed the size of the frame';
	};

	Frame.prototype.next = function () {
		if (this.hasMore()){
			this.cursor+=this.step;
		}

		return _frame.call(this);
	};

	Frame.prototype.hasMore = function(){
		return this.cursor + this.size <= this.data.length + this.step;
	}

	Frame.prototype.prev = function () {
		if (this.cursor >= 0)
		this.cursor-=this.step;

		return _frame.call(this);
	};

	Frame.prototype.to = function(n){

	};

	var _frame = function(){
		if (this.cursor < 0 || !this.hasMore()) return [];

		var cursor = Math.min(this.cursor, this.data.length - this.size);
		return this.data.slice( cursor , Math.min(cursor + this.size, this.data.length) );
	}

	Frame.prototype.current = function(){
		return _frame.call(this);
	};


	function forEach(callback){

		// array iterator
		if(this instanceof Array){
			for(var i=0; i<this.length; i++){
				callback(this[i]);
			}
		}

		// property iterator
		if(this instanceof Object){
			var keys = Object.keys(this);
			for(var i=0; i<keys.length; i++){
				callback( keys[i],this[keys[i]]);
			}
		}
		return data(this);
	};


	function groupBy(grouping, groupingFunction){
		var groupings = {};

		//array iterator
		if(this instanceof Array){
			for(var i=0; i<this.length; i++){

				var groupkey = typeof grouping === 'function' ? grouping(this[i],groupings) : null;
				if(!groupkey) groupkey = 'default';

				var value = groupings[groupkey];
				if(!value) {
					if(typeof groupingFunction === 'function' && groupkey !== 'default')
						groupings[groupkey] = null;
					else
						groupings[groupkey] = [];
				}

				if(typeof groupingFunction === 'function' && groupkey !== 'default') {

					groupings[groupkey] = groupingFunction(this[i], groupings[groupkey]);

				} else {

					groupings[groupkey].push(this[i]);
				}
			}

			return data(groupings);
		}


		//map iterator
		if(this instanceof Object){
			return data(groupings);
		}

		return data(this);
	};


	function filter(condition){

		//array iterator
		if(this instanceof Array){
			var result = [];
			if(typeof condition !== 'function') return data(this);
			for(var i=0; i<this.length; i++){
				if(condition({key:i,value:this[i]}) === true) {
					result.push(this[i]);
				}
			}
			return data(result);
		}

		// map iterator
		if(this instanceof Object){
			result = {};
			var keys = Object.keys(this);

			if(!keys) 			return data(result);
			if(keys.length < 1) return data(result);

			for(var i=0; i<keys.length; i++){
				if(this.hasOwnProperty(keys[i]))
				if(condition({key:keys[i],value:this[keys[i]]}) === true)
					result[keys[i]] = this[keys[i]];
			}
			return data(result);
		}
	};


	/**
	 *	Array transformation function
	 */
	function _objectToArray(onitem){
		var result = []
		, keys = Object.keys(this);

		if(!keys) return data(result);
		if(keys.length < 1) return data(result);

		for(var i=0; i<keys.length; i++){
			if(this.hasOwnProperty(keys[i])){
				var value = this[keys[i]];
				if(typeof onitem === 'function')
					value = onitem(keys[i],value,i);

				if(value == null || value == undefined) continue;
				result.push(value);
			}
		}
		return data(result);
	};

	/**
	 *	Array transformation function
	 */
	function _numberToArray(onitem){
		var n = +this
		,	result = [];

		for(var i=0; i < n; i++){
			var value = i;

			if(typeof onitem === 'function')
				value = onitem(i,value,i);

			if(value == null || value == undefined) continue;
			result.push(value);
		}
		return data(result);
	};

	function _contArrays(target, source){
		if(!target) return;
		if(!(source instanceof Array)) return;

		for(var i=0; i<source.length; i++){
			target.push(source[i]);
		}
		return target;
	};


	function defaultComparator(a,b) {
		var aa = +a
		,	bb = +b;

		aa = Number.isNaN(aa)?a:aa;
		bb = Number.isNaN(bb)?b:bb;

		if(aa < bb) return -1;
		if(aa > bb) return 1;
		return 0;
	};


	function sort(callback){
		//may only sort arrays

		if(!callback) callback = defaultComparator;

		var target = this;
		return {
			asc:function(){
				target.sort(callback);
				return data(target);
			},
			desc:function(){
				target.sort(function(a,b) {return -1 * callback(a,b);});
				return data(target);
			}
		};
	};



	function first(){
		if(! (this instanceof Array) ) return null;
		return data(this[0]);
	};


	function nth(n){
		if(!(this instanceof Array)) return null;
		return data(this[n]);
	};

	function size(){
		if(this instanceof Array) return this.length;
	};

	function add(source){
		if(!source) return data(this);

		if(this instanceof Array && source instanceof Array ){
			return data(_contArrays(this,source));
		}

		if(this instanceof Array){
			return data(this.push(source));
		}

		return data(this);
	};

	function asyncIterator(d, callback,pageSize, oncomplete, oninterrupt){
		var page_size = 20
		,	length = 0;

		if(typeof d === 'number') length = d;
		if(d instanceof Array ) length = d.length;

		if(pageSize) page_size = pageSize;

		var	pages = Math.floor(length / page_size) + ( (length % page_size) / (length % page_size ))
		,	count = {p:0};

		var fn = function(){
			if(count.p >=  pages) {
				if(typeof oncomplete === 'function' ) oncomplete();
				return;
			}
			var start = page_size * count.p
			,	end  = start + page_size;
			for(var i = start;
					i < end && i < length;
					i++ ) {
				callback(i)
			}
			count.p++;
			if(typeof oninterrupt === 'function') oninterrupt();
			setTimeout(fn,1);
		}

		fn();
	};


	function data(d){

		var i = null;

		if(typeof d === 'number') 		i = new NumericIterator(d);
		else if(d instanceof Array) 	i = new ArrayIterator(d);
		else if(d instanceof Iterator)	i = d;
		else if(typeof d === 'object') 	i = new ObjectIterator(d);


		return {
			to:	function to(callback){
				return data(new NestedIterator(i, callback));
			},
			each:function(callback){
				i.iterate(callback);
			},
			next:function(callback){
				return i.next(callback);
			},
			current: function current(){
				return i.current();
			},
			array:function current(){
				return i.current();
			},
			asyncloop	:function(callback, pageSize){return function(oncomplete, onint){
						return asyncIterator(d, callback, pageSize, oncomplete, onint);}
			},
			sort		:function(callback){return sort.call(d,callback);}
		}


/*
		var _export  = {
			foreach		:function(callback){return forEach.call(d,callback);},
			filter		:function(callback){return filter.call(d,callback);},
			group		:function(callback,gfn){return groupBy.call(d,callback,gfn);},
			first		:function(callback){return first.call(d);},
			nth			:function(callback){return nth.call(d);},
			page        :function(size,start) { return new Paginator(d, size, start);},
			frame       :function(size,move){return new Frame(d,size,move);},
			sort		:function(callback){return sort.call(d,callback);},
			size		:function(callback){return size.call(d,callback);},
			add			:function(toadd){return add.call(d,toadd);},
			asyncloop	:function(callback, pageSize){return function(oncomplete, onint){
							return asyncIterator(d, callback, pageSize, oncomplete, onint);}
						},
			result  	:function(){return itr.current();}
		};

		// multiplex "to" function
		if(typeof d === 'number' || (d instanceof Number)){
			_export.to = function(callback){return _numberToArray.call(d,callback);};
		} else if(typeof d === 'object' || d instanceof Array) {
			_export.to = function(callback){return _objectToArray.call(d,callback);};
		}

		return _export;
*/
	};


	return {
		data : data,
		DataStep : DataStep,
		NumericIterator: NumericIterator,
		compare:{'default':defaultComparator}
	};
}
});
