/**
 * 
 * @param {object} data 
 */
function DataItem(data){
    return _initDataItem.call(this, data);
}

DataItem.prototype.setValue = function(value){
    if(value == null) return this;
    this._values[++this._version] = value;
    if(this._parent == null) {
        return this;
    } 

    var source = _getSource(this._parent);
    if(source != null) {
        source[this._path] = this._values[this._version];
    }
    return this;
};

DataItem.prototype.path = function(path){
    if(path == null || path == '') return null;
    return _path(this,_getSource(this),path.split('.'));
};

DataItem.prototype.getValue = function(){

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


/**
 * 
 * @param {DataItem} data 
 */
function _initDataItem(data){
    this._parent = null;
    this._pathmap = Object.create(null);
    this.setValue(data);
    return this;
}

/**
 * 
 * @param {*} dataItem 
 */
function _getSource(dataItem){
    if(dataItem._parent == null) {
        return dataItem._values[dataItem._version];
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
    var value = source[property];

    if(child == null) {
        child = dataItem._pathmap[property] = new DataItem();
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


var di = new DataItem(obj1);

var weight = di.path('weight');
var street = di.path('address.street');
var address = di.path('address');

weight.setValue(10);

address.setValue({
    street:'spadina',
    apt:12
});

street.setValue('king');

