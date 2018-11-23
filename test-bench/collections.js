
    /**
     * 
     * @param {Number} number of sequential elements in the collection 
     */
    function NumericIterator(num){
        this._source = num;
        this._i = -1;
        this.current = null;
    }

    NumericIterator.prototype.next = function(){
        if(this._i == (this._source-1)) {
            this.current = null;
            return false;
        } 
        this.current = ++this._i;
        return true;
    }

    NumericIterator.prototype.reset = function(){
        this._i = -1;
        this.current = null;
        return this;
    }

    /**
     * Iterates over Array object
     * @param {Array} array 
     */
    function ArrayIterator(array){
        this._i = -1;
        this._source = array;
        this.current = null;
        this.key = null;
    }

    ArrayIterator.prototype.next = function(){
        if(this._i >= (this._source.length-1)){
            this.current = null;
            this.key = null;
            return false;
        }
        this.key = ++this._i;
        this.current = this._source[this.key];
        return true;
    };

    ArrayIterator.prototype.reset = function(){
        this._i = -1;
        this.current = null;
        this.key = null;
        return this;
    };

    /**
     * Iterates over object's owned properties
     * @param {Object} obj 
     */
    function ObjectIterator(obj){
        this._source = obj;
        this._keys = Object.keys(this._source);
        this._i = -1;
        this.current = null;    
        this.key = null;
    }

    ObjectIterator.prototype.next = function(){
        if(this._i >= (this._keys.length-1)){
            this.current = null;
            this.key = null;
            return false;
        } 
        this.key = this._keys[++this._i];
        this.current = this._source[this.key];
        return true;
    };

    ObjectIterator.prototype.reset = function(){
        this._i = -1;
        this.current = null;
        this.key = null;
        return this;
    };

    /**
     * 
     * @param {*} iterator 
     * @param {*} filter 
     */
    function FilterIterator(iterator,filter){
        this._iterator = iterator;
        this._filter = filter;
        this.current = null;
        this.key = null;
    };

    FilterIterator.prototype.next = function(){
        while(this._iterator.next()) {
            if(this._filter(this._iterator.current)){
                this.current = this._iterator.current;  
                this.key = this._iterator.key;      
                return true;
            }
        }
        this.current = null;
        this.key = null;
        return false;
    };

    FilterIterator.prototype.reset = function(){
        this._iterator.reset();
        this.current = null;
        this.key = null;
        return this;
    };

    /**
     * 
     * @param {*} iterator 
     * @param {*} selector 
     */
    function SelectIterator(iterator,selector){
        this._iterator = iterator;
        this._selector = selector;
        this.current = null;
        this.key = null;
    };

    SelectIterator.prototype.next = function(){
       if(this._iterator.next()) {
            this.current = this._selector(this._iterator.current);  
            this.key = this._iterator.key;  
            return true;
        }
        this.current = null;
        this.key = null;
        return false;
    };

    SelectIterator.prototype.reset = function(){
        this._iterator.reset();
        this.current = null;
        this.key = null;
        return this;
    };

    /**
     * 
     * @param {*} collection 
     * @param {*} filter 
     * @param {*} selector 
     */

    function Collection(collection) {
        this._collection = collection;
    }

    function FilteredCollection(collection, filter){
        Collection.call(this,collection);
        this._filter = filter;
    }

    function SelectCollection(collection, selector){
        Collection.call(this,collection);
        this._selector = selector;
    }

    function GroupedCollection(collection, grouping){
        Collection.call(this,collection);
        this._grouping = grouping;
    }

    function MapCollection(collection, fnkey, fnselect){
        Collection.call(this,collection);
        this._fnkey = fnkey;
        this._fnselect = fnselect;
    }

    FilteredCollection.prototype = Object.create(Collection.prototype);
    FilteredCollection.prototype.iterator = function(){
        return new FilterIterator(Collection.prototype.iterator.call(this),this._filter);
    };

    SelectCollection.prototype = Object.create(Collection.prototype);
    SelectCollection.prototype.iterator = function(){
        return new SelectIterator(Collection.prototype.iterator.call(this),this._selector);
    };

    GroupedCollection.prototype = Object.create(Collection.prototype);
    GroupedCollection.prototype.iterator = function(){
        if(this._groups != null) return new ObjectIterator(this._groups);
        
        var iterator = Collection.prototype.iterator.call(this);
        var groups = {};
        while(iterator.next()){
            var key = this._grouping(iterator.current)
            var list = groups[key];
            if(list == null) {
                list = groups[key] = [];
            }
            list.push(iterator.current);
        }
        this._groups = groups;
        return new ObjectIterator(this._groups);
    };

    MapCollection.prototype = Object.create(Collection.prototype);
    MapCollection.prototype.iterator = function(){
        if(this._map != null) return new ObjectIterator(this._map);

        var iterator = Collection.prototype.iterator.call(this);
        var map = {};
        while(iterator.next()){
            var key = this._fnkey(iterator.current);
            var value = this._fnselect(iterator.current);
            this._map[key] = value;    
        }
        this._map = map;
        return new ObjectIterator(this._map)
    };

    Collection.prototype.iterator = function() {
        if(typeof this._collection == 'number'){
            return new NumericIterator(this._collection);
        }

        if(this._collection instanceof Array){
            return new ArrayIterator(this._collection);
        }

        if(this._collection instanceof Collection){
            return this._collection.iterator();
        }

        if(typeof this._collection == 'object'){
            return new ObjectIterator(this._collection);
        }

        throw 'Unsupoorted collection type';
    };

    Collection.prototype.forEach = function(fn){
       var iterator = this.iterator();
       while(iterator.next()) {
           fn(iterator.current,iterator.key);
       }
    };

    Collection.prototype.where = function(filter){
        return new FilteredCollection(this, filter);
    };

    Collection.prototype.select = function(selector){
        return new SelectCollection(this,selector);
    };

    Collection.prototype.toArray = function(){
        var result = [];
        this.forEach(function(item){
            result.push(item);
        });
        return result;
    };

    Collection.prototype.groupBy = function(grouping){
        return new GroupedCollection(this,grouping);
    };


    Collection.prototype.toMap = function(fnKey, fnSelect){
        return new MapCollection(this, fnKey, fnSelect);
    };

Collection.prototype._toMap = function(funcKey,funcItem){
    var mappedCollection = new Collection(this);
    if(!funcItem) funcItem = function(item){return item;}

    var map = {};
    this.forEach(function(item,key){
        var key = funcKey(item, key);
        map[key] = funcItem(item, key);
    });

    mappedCollection.forEach = function(fn){
        _forEach(map,function(item,i){
            fn(item,i);
        });
    };

    mappedCollection.toObject = function(){
        return map;
    };

    return mappedCollection;
};



Collection.prototype.orderBy = function(func,comparator){
    return _orderBy.call(this,func,comparator,1);
};

Collection.prototype.orderByDesc = function(func,comparator){
    return _orderBy.call(this,func,comparator,-1);
};

Collection.prototype.aggregate = function(func){

};

Collection.prototype.max = function(func){
    var max = {value : null };
    func = func || function(x){return x;}
    this.forEach(function(item){
        var x = func(item);
        if(max.value < x) {
            max.value = x;
        }
    });
    return max.value;
};

// todo: refactor to use iterators, this will enumerate the entire collectino
Collection.prototype.first = function(){
    var first = null;    
    this.forEach(function(item){
        if(first != null) return;
        first = item;
    });
    return first;
};

Collection.prototype.min = function(func){
    var min = {value : null };
    var count = 0;
    func = func || function(x){return x;}
    this.forEach(function(item){
        var x = func(item);
        if(count++ == 0){
            min.value = x;
        }
        if(min.value > x) {
            min.value = x;
        }
    });
    return min.value;
};

Collection.prototype.selectMany = function(func){
    var nestedCollection = new Collection(this);
    // override forEach
    nestedCollection.forEach = function(fn){
        Collection.prototype.forEach.call(this,function(item,i){
            _forEach(func(item),fn);
        });        
    }
    return nestedCollection;
};


Collection.prototype.forIndex = function(index){
    if(this._data instanceof Collection){
        return this._data.forIndex(index);
    }

    if(this._data instanceof Array){
        return this._data[index];
    }

    throw 'Collection operation is not supported, pending implementation';
};

    /**
     * 
     * @param {*} data 
     * @param {function} fn 
     */
    function _forEach(data,fn) {

        // iterate Collection object
        if(data instanceof Collection){
            data.forEach(fn);
            return;
        }

        // iterate over array
        // if(data instanceof Array) {
        //     for(var i=0; i < data.length; i++){
        //         fn(data[i], i);
        //     }
        //     return;
        // }

        // iterate for a 'number' of consecutive digits
        if(typeof(data) == 'number'){
            for(var i=0; i < data; i++){
                fn(i,i);
            }
            return;
        }

        // iterate of object or array
        if(typeof(data) == 'object' || data instanceof Array){
            var keys = Object.keys(data);
            for(var i=0; i< keys.length; i++){
                fn(data[keys[i]],keys[i]);
            }
            return;
        }

        // iterate over string characters
        if(typeof(data) == 'string'){
            for(var i=0; i< data.length; i++){
                fn(data[i],i);
            }
        }
    }

    function _orderBy(func,comparator,direction){
        var sortedColleciton = new Collection(this);
        var array = this.toArray();
        sortedColleciton.forEach = function(foo){
            if(func == null) {
                _forEach(array.sort(),foo);
                return;
            }
    
            if(comparator == null) {
                comparator = function(a,b){
                    if(a < b) return -1;
                    if(a > b) return 1;
                    return 0; 
                };
            }
    
            if(func != null) {
                _forEach(array.sort(function(a,b){
                    var _a = func(a);
                    var _b = func(b);
                    return direction * comparator(_a,_b);
                }),foo);
                return;
            }
        }
        return sortedColleciton;
    }





var x = new Collection([1,2,3,4,5,6]);

//var filteredCollection = x.where(function(i){return i%2 == 0});
//filteredCollection.select(function(z){return z*2;})
//.forEach(function(i){console.log(i);})

x.groupBy(function(item){return item%2;})
.forEach(function(item,key){
    console.log(item);
});

//filteredCollection.where(function(k){return k == 6; }).forEach(function(i){console.log(i);})

//.where(item => item == 4 || item == 5).where(item=>item %2 == 0 ).toArray();

// var all = collection(10);
// console.log(all.toArray());

// var even = all.where(item=>item %2 == 0 );
// console.log(even.toArray());

// var odd = even.select(item => item + 1);
// console.log(odd.toArray());

// var even2 = odd.select(item => item * 2);
// console.log(even2.toArray());

// console.log(collection(10).where(item=>item %2 == 0 ).select(item => item + 1).select(item => item * 2).toArray());

// var y = collection(10)
//     .groupBy(x => x % 2)
//     .select((item,key) => key)
//     .toArray();
// console.log(y);

// var y2 = collection(10)
//     .groupBy(x => x % 2)
//     .select(x => x.value)
//     .toArray();

// var z = collection(10)
//     .groupBy(x => x % 2)
//     .selectMany((item,key) => item.value)
//     .toArray();

//     console.log(y2);
//     console.log(z);

// var max = collection(10)
//     .groupBy(x => x % 2)
//     .selectMany((item,key) => item.value)
//     .max();

// console.log("max:" + max);

// var min = collection(10)
//     .groupBy(x => x % 2)
//     .selectMany((item,key) => item.value)
//     .min();

// console.log("min:" + min);


// var s = collection('this is a test')
//         .where(x => x !== ' ')
//         .toArray();

// console.log(s);

// var m = collection([{id:12,name:'test12'}, {id:2,name:'test2'}]).toMap(x=>x.id).toArray();
// console.log(m);

