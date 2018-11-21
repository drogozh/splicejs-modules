/**
 * 
 * @param {object} data 
 */
function DataItem(data){
    return _initDataItem.call(this, data);
}

DataItem.prototype.setValue = function(value){
    if(value == null) return this;
    if(this._parent == null) {
        this._source = value;
        return this;
    }
    // 
    this._values[++this._version] = value;    
    var source = _getSource(this._parent);
    if(source == null) {
        return source;
    }
    source[this._path] = value;
    return this;
};

DataItem.prototype.path = function(path){
    if(path == null || path == '') return null;
    return _path(this,_getSource(this),path.split('.'));
};

DataItem.prototype.getValue = function(){
    var source = _getSource(this._parent);
    return source != null ? source[this._path] : null;
};

/**
 * CollectionDataItem
 * @param {Array} data 
 */
function CollectionDataItem(data){
    _initDataItem.call(this, data);
}

CollectionDataItem.prototype = Object.create(DataItem.prototype);
CollectionDataItem.prototype.constructor = CollectionDataItem;

CollectionDataItem.prototype.remove = function(){
};

CollectionDataItem.prototype.insert = function(item, position){

};

CollectionDataItem.prototype.path = function(path){
    if(path == null || path == '') return null;
    return _path(this,_getSource(this),path.split('.'));
};

/**
 * 
 * @param {DataItem} data 
 */
function _initDataItem(data){
    this._parent = null;
    this._pathmap = Object.create(null);
    this._version = 0;
    this.setValue(data);
    return this;
}

/**
 * 
 * @param {*} dataItem 
 */
function _getSource(dataItem){
    if(dataItem._parent == null) {
        return dataItem._source;
    }
    var source = _getSource(dataItem._parent);
    if(source == null) return source;
    return source[dataItem._path];
}

/**
 * 
 * @param {DatItem} dataItem 
 * @param {Array} path 
 */
function _path(dataItem, source, path)
{
    if(!path || path.length < 1) return dataItem;
    var property = path.shift();

    if(property == null) return dataItem;

    var child = dataItem._pathmap[property];
    
    var value = source != null ? source[property] : null;

    if(child == null) {
        if(value instanceof Array){
            child = dataItem._pathmap[property] = new CollectionDataItem();
        } else {
            child = dataItem._pathmap[property] = new DataItem(); 
        }
        child._values = [value];
        child._path = property;
        child._parent = dataItem;
    }

    return _path(child, value, path);
}

//---------------------------------------------
var obj1 = {
    name:'test',
    weight: 20,
    address:{
        street:'bloor',
        apt:12
    },
    children: [
        {name:'child1'},
        {name:'child2'},
        {name:'child3'}
    ]
};

var obj2 = [1,2,3,4,5];

// case for missing properties
//var p1 =new DataItem({}).path('one.two.tree');
//p1.setValue(3);

//
var di = new DataItem(obj1);

//------------------
var children = di.path('children');
var value = children.getValue();
console.log(children.getValue());

//------------------
var weight = di.path('weight');
weight.setValue(10);

//------------------
var street = di.path('address.street');
street.setValue('king');

// -----------------
var address = di.path('address');
address.setValue({
    street:'spadina',
    apt:12
});
