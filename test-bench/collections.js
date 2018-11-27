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
     * Iterates skipping values where 
     * filter function evaluates to 'false'
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
     * Collection root class
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

        var selector = typeof(this._fnselect) == 'function' ? this._fnselect : function(item){return item;};
        while(iterator.next()){
            var key = this._fnkey(iterator.current, iterator.key);
            var value = selector(iterator.current, iterator.key);
            map[key] = value;    
        }
        this._map = map;
        return new ObjectIterator(this._map)
    };

    MapCollection.prototype.get = function(key){
        this.iterator();
        return this._map[key];
    }

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

    Collection.prototype.first = function(filter){
        var iterator = this.iterator();
        var filter = typeof(filter) == 'function' ? filter : function(){return true;}
        while(iterator.next()){
            if(filter(iterator.current)) return iterator.current;
        }
    };

    var CONST_MAX = 1;
    var CONST_MIN = -1;
    var CONST_SORT_ASC = 1;
    var CONST_SORT_DESC = -1;

    Collection.prototype.max = function(comparator){
        return _maxmin(this.iterator(),comparator,CONST_MAX);
    };

    Collection.prototype.min = function(comparator){
        return _maxmin(this.iterator(),comparator,CONST_MIN);
    };

    Collection.prototype.orderBy = function(comparator,selector){
        return _sorter(this,comparator,selector,CONST_SORT_ASC);
    };

    Collection.prototype.orderByDesc = function(comparator,selector){
        return _sorter(this,comparator,selector,CONST_SORT_DESC);
    };

    Collection.prototype.selectMany = function(){
        throw 'Not Implemented';
    };

    function _defaultComparator(a,b){
        if(a < b) return -1;
        if(a > b) return 1;
        return 0; 
    }

    function _defaultSelector(item){
        return item;
    }
    
    function _sorter(collection,comparator,selector,direction){
        if(typeof(selector) =='function'){
            collection = SelectCollection(this,selector);
        }
        comparator = comparator || _defaultComparator;
        var _comparator = function(a,b){return direction * comparator(a,b);};
        new Collection(collection.toArray().sort(_comparator));
    }

    function _maxmin(iterator,comparator,direction){
        iterator.next();
        var value = iterator.current;
        comparator = comparator || _defaultComparator;
        while(iterator.next()){
            value = comparator(value,iterator.current) == direction ? value : iterator.current
        }
        return value;
    }




var x = new Collection([6,2,3,4,5,1]);

//var filteredCollection = x.where(function(i){return i%2 == 0});
//filteredCollection.select(function(z){return z*2;})
//.forEach(function(i){console.log(i);})

// x.groupBy(function(item){return item%2;})
// .forEach(function(item,key){
//     console.log(item);
// });

var min = x.min();
var max = x.max();

var z = x.toMap(function(item,key){
    console.log(item,key);
    return key + 1;
})

var two = z.get(2);
var f = z.first(function(i){return i ==4});

console.log(z);

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

