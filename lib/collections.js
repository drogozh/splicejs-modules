define(function(){
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
    };

    NumericIterator.prototype.nextTo = function(idx){
        this._i = idx-1;
        return this.next();
    };

    NumericIterator.prototype.reset = function(){
        this._i = -1;
        this.current = null;
        return this;
    };

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

    ArrayIterator.prototype.nextTo = function(idx){
        this._i = idx-1;
        return this.next();
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

    ObjectIterator.prototype.nextTo = function(idx){
        this._i = idx-1;
        return this.next();
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
        this._i = -1;
        this.current = null;
        this.key = null;
    };

    FilterIterator.prototype.next = function(){
        while(this._iterator.next()) {
            if(this._filter(this._iterator.current,this._iterator._i)){
                this.current = this._iterator.current;  
                this.key = this._iterator.key;
                this._i++;      
                return true;
            }
        }
        this.current = null;
        this.key = null;
        return false;
    };

    FilterIterator.prototype.nextTo = function(idx){
        if(this._i > idx) { this.reset(); }
        while(this._i < idx && this.next());
    };

    FilterIterator.prototype.reset = function(){
        this._iterator.reset();
        this._i = -1;
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
        this._i = -1;
        this.current = null;
        this.key = null;
    };

    SelectIterator.prototype.next = function(){
       if(this._iterator.next()) {
            this.current = this._selector(this._iterator.current,this._iterator.key);  
            this.key = this._iterator.key;  
            return true;
        }
        this.current = null;
        this.key = null;
        return false;
    };

    SelectIterator.prototype.nextTo = function(idx){
        if(this._i > idx) { this.reset(); }
        while(this._i < idx && this.next());
    };

    SelectIterator.prototype.reset = function(){
        this._iterator.reset();
        this._i = -1;
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
            var key = this._grouping(iterator.current, iterator.key)
            var group = groups[key];
            if(group == null) {
                group = groups[key] = {key:key, value:[]};
            }
            group.value.push(iterator.current);
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
    };

    MapCollection.prototype.toObject = function(){
        this.iterator();
        return this._map;
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

    Collection.prototype.add = function(item){
        if(this._collection instanceof Array){
            this._collection.push(item);
            return this;
        }

        if(this._collection instanceof Collection){
            this._collection.add(item);
            return this;
        }

        throw 'Collection does not support add operation';
    };

    Collection.prototype.remove = function(itemIndex){

        if(this._collection instanceof Array){
            this._collection.splice(itemIndex,1);
            return new ArrayIterator(this._collection);
        }

        if(this._collection instanceof Collection){
            this._collection.remove(itemIndex);
            return this;
        }

        throw 'Collection does not support add operation';
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

    Collection.prototype.indexOf = function(filter){
        var iterator = this.iterator();
        var counter = 0;
        while(iterator.next()){
            if(filter(iterator.current)) return counter;
        }
        return -1;
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

    Collection.prototype.orderBy = function(comparator){
        return _sorter(this,comparator,CONST_SORT_ASC);
    };

    Collection.prototype.orderByDesc = function(comparator){
        return _sorter(this,comparator,CONST_SORT_DESC);
    };

    Collection.prototype.forIndex = function(idx){
        var iterator = this.iterator();
        if(iterator.nextTo(idx)){
            return iterator.current;
        }
        return null;
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
    
    function _sorter(collection,comparator,direction){
        comparator = comparator || _defaultComparator;
        var _comparator = function(a,b){return direction * comparator(a,b);};
        return new Collection(collection.toArray().sort(_comparator));
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

    function _collection(data){
        if(data == null) return null;
        return new Collection(data);
    }

    return {
        collection: _collection,
        defaultComparator: _defaultComparator,
        Collection: Collection
    }

});