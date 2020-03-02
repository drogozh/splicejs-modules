define([
  {
    Inheritance  :'inheritance',
    Events        :'event',
    Util          :'util'
  }
],function(imports){
  "use strict";
  
  var
        Class = imports.Inheritance.Class
  ,     Events = imports.Events
  ,     TextUtil = imports.Util.Text
  ,     log = imports.Util.log
  ;

    var EXCEPTIONS  = {
        invalidSourceProperty : 'Invalid source property',
        invalidPath           :	'Reference data-item path is not specified',
        invalidPathDepth      :	'Ivalid DataItem path',
        invalidDeleteOperation:	'Invalid delete operation, on an object',
        invalidDelegateSource : 'Unable to create data-item delegate, source is not an instance of DataItem'
    }

    /*
        ------------------------------------------------------------------------------
        DataItem class
    */
    function DataItem(data){
      //core properties
      this.parent = null;
      this.pathmap = Object.create(null);
      this._change = 0;

      //-1 indicates empty dataItem
      this._version = -1;
      this._versionMap = {};

      if(data!= null) this.setValue(data);

      Events.attach(this,{
        onChange:Events.MulticastEvent
      });

    };

    DataItem.prototype.getValue = function(){
      if(this._temp) {
        return this._tempValue;
      }

      var s = _recGetSource(this);
      if(this._path == null) return s;
      return !s ? undefined : s[this._path];
    };

    DataItem.prototype.getStringValue = function(){
      var value = this.getValue();
      if(value == null) return '';
      return value.toString();
    };

    DataItem.prototype.get = function(){
         var value = {};
         _getVersionSource(this,function(di){
            value._result = di._value;
         });       
         return value._result;
    }

 

    DataItem.prototype.set = function(value){
        //1. no parent - this is root, set source to value
        if(this.parent == null) {
            this.source = this.source || new VersionItem();
            this.source.set(value);
            return this;
        }
        _getVersionSource(this,function(root){
            root._parent._map[root._path].push(
                new VersionItem(value,root._parent,root._path)
            );
        });
    }

    //up the path tree
    //down the version tree
    function _getVersionSource(di,fn,x){
        if(di.parent == null) {
            if(!di.source || !di.source._map) return null;
            if(!di.source._map['root']) return null;
            
            var v = di.source._map['root'].length - 1;
            if(v < 0 ) v = 0;
            return di.source._map['root'][v];
        }
        var root = _getVersionSource(di.parent,fn,1);
        root._map = root._map || {};
        var versionPath = root._map[di._path];
        //initialize empty version path map
        if(versionPath == null) {
            versionPath = root._map[di._path] = []; 
        }

        //last version
        var version = versionPath.length-1;
        if(version < 0) version = 0;

        var versionItem = versionPath[version];
        if(!versionItem){
            versionItem = versionPath[version] = 
                new VersionItem(root._value[di._path],root);
            versionItem._path = di._path;
        }

        //recursion entry
        if(x == null) {
            fn(versionItem);
        }
        return versionItem;
    }

    DataItem.prototype.getOwner = function(){
      return _recGetSource(this);
    };

    DataItem.prototype.stage = function(){
      this._isStaged = true;
      return this;
    };

    function _isStaged(){
      var root = this;
      while(root != null){
        if(root._isStaged == true) return true;
        root = root.parent;
      }
      return false;
    }

    DataItem.prototype.commit = function(){
     _commit(this);
      return this.reset();
    };

    function _commit(dataItem){
      if(dataItem == null) return;
      if(dataItem._stagedValue !== undefined){
        _setValue.call(dataItem, dataItem._stagedValue);
      }
      if(dataItem.pathmap == null) return;
      var keys = Object.keys(dataItem.pathmap);
      for(var i in keys){
        var key = keys[i];
        _commit(dataItem.pathmap[key]);
      }
      return this;
    }

    DataItem.prototype.reset = function(){
      this._isStaged = false;
      this._stagedValue = undefined;
      return this;      
    };

    /*
        setValue must not access arbitrary object keys
        rework add ArrayDataItem
    */
    /*
        todo: ???  create separate events for new, unpdated, deleted
        this enable observers to track specific changes separately
    */
      DataItem.prototype.setValue = function(value){
        /*
          set initial value, nothing to bubble
          this is a new value
        */
        if(this.parent == null) {
          this.source = value;
          return this;
        }

        //find data source
        var source = _recGetSource(this);
        var isStaged = _isStaged.call(this);

        var currentValue = source[this._path];
        if(isStaged){
          currentValue = this._stagedValue;
        } 

        //same as current value
        if(currentValue === value) return this;

        if(isStaged){
          this._stagedValue = value;
          return this;
        }
        return _setValue.call(this,value);
    };

    DataItem.prototype.getStagedValue = function(){
      if(_isStaged.call(this)){
        if(this._stagedValue == undefined){
          return this.getValue();
        }
        return this._stagedValue;
      }
      return this.getValue();
    };

    function _setValue(value){
      var source = _recGetSource(this);
      var currentValue = source[this._path];
      //same as current value
      if(currentValue === value) return this;

      // set value
      source[this._path] = value;
      this._change++;
      _triggerOnChange.call(this);
      return this;
    }

  	/**
  		returns child DataItem
  	*/
  	DataItem.prototype.path = function(path){
      return _path(this,path);
    };
    
    /**
     * Returns DataItem that will have no effect
     * on original source item
     */
    DataItem.prototype.tempPath = function(path){
      return _path(this,path,true);
    };

  	DataItem.prototype.fullPath = function(){
  		var node = this;
  		var path = '', separator = '';
  		while(node != null){
  			if(node._path != null) {
  				path = node._path + separator + path;
  				separator = '.';
  			}
  			node = node.parent;
  		}
  		return path;
  	};

  	//tranverse path map tree to get change paths at current level
  	DataItem.prototype.changes = function(version,onNew, onUpdated, onDeleted){
  		var keys = Object.keys(this.pathmap);
  		for(var key in keys){
            var item = this.pathmap[keys[key]];
  			if(item._updated){
                onUpdated(item);
                continue;
            }
            if(item._new){
                onNew(item);
                continue;
            }
            if(item._c_deleted){
  				onDeleted(item);
                continue;
            }
  		}
  	};

    //traverse path map and output changes
    DataItem.prototype.changePath = function(onItem){
        //_pathWalker(this,list,'');
        var list = []; 
        _visitPaths(this,list,'');
        for(var i in list){
          onItem(list[i]);
        }
    };

    function _visitPaths(root,list,branch){
      if(root._change > 0) {
        list.push(branch);
      };
      var sep = branch ? '.' : '';
      for(var key in root.pathmap){
        _visitPaths(root.pathmap[key],list,branch + sep + key);
      }
    }

    /*
      !!! There is not delegation ons subscribe
      Delegator item acts as an event aggregator
    */
  	DataItem.prototype.subscribe = function(handler, instance){
      var node = this;
      //create change event
      Events.attach(this,{
        onChange:Events.MulticastEvent
      }).onChange.subscribe(handler,instance);

      var item = this;
      while(item.parent != null){
        if(!item.parent.eventmap) item.parent.eventmap = Object.create(null);
        item.parent.eventmap[item._path] = item;
        item = item.parent;
      }
    };

    DataItem.prototype.unsubscribe = function(fn){
      if(this.onChange) this.onChange.unsubscribe(fn);
    };


    function VersionItem(value,parent,path){
        this._value = value;
        
        if(parent){
            this._parent = parent;
        }

        if(path){
            this._path = path;
        }
    }

    VersionItem.prototype.set = function(value){
        var versions = null;
        if(this._parent == null){
            this._map = this._map || {};
            this._map.root = this._map.root || [];
            versions = this._map.root;
        } else {
            versions = this._parent._map[this._path];
        }
        
        versions.push(new VersionItem(value,this));
        return this;
    }




    /**
      ArrayDataItem
    */
    function ArrayDataItem(data){
      this.base(data);
        this._length = data.length;
    }
    
    Class(ArrayDataItem).extend(DataItem);

    ArrayDataItem.prototype.remove = function(dataItem){
      if(!(this.source instanceof Array)) throw EXCEPTIONS.invalidDeleteOperation;
      _setChangeState(this,true);
      _bubbleChange(this);
      return this;
    };

    /**
      Virtual Append, adds new element to source array
      initial value is undefined
    */
    ArrayDataItem.prototype.append = function(){
      var d = new DataItem(this.source);
      d._path = this._length++;
      this.pathmap[d._path] = d;
      return d;
    };


    /**

    */
    var DelegateDataItem = Class(function DelegateDataItem(delegate){
      //do not invoke super constructor on purpose
      if(!(delegate instanceof DataItem))
        throw EXCEPTIONS.invalidDelegateSource;

        this.base();
        //create change event
        Events.attach(this,{
          onChange:Events.MulticastEvent
        });

        this._delegate = delegate;
        this._delegate.subscribe(this.onChange, this);

    }).extend(DataItem);


    DelegateDataItem.prototype.getValue = function() {
      return this._delegate.getValue();
    };

    DelegateDataItem.prototype.setValue = function(value){
      return this._delegate.setValue(value);
    };

    DelegateDataItem.prototype.path = function(path){
      return _path(this._delegate,path);
    };

    //hidden methods
    function _recGetSource(dataItem, i){
      if(dataItem.parent == null){
        if(dataItem._path) return dataItem.source[dataItem._path];
        return dataItem.source;
      }
      var source = _recGetSource(dataItem.parent,1);
      if(i == null) return source;
      if(source == null) return null;
      return source[dataItem._path];
    };

    //!!!!! must have circular reference detection implementation
    function _notifyDown(dataItem, source){
      if(dataItem.onChange) dataItem.onChange(dataItem);
      for(var key in dataItem.eventmap){
        _notifyDown(dataItem.eventmap[key],source);
      }
    };


    /**
      
    */
    function _path(dataItem, path, isTemp){
      if(path == null) return dataItem;

      var source = _recGetSource(dataItem,0);
      var parts = path.toString().split('.');

      var parent = dataItem;
      for(var i=0; i < parts.length; i++){

        if(source)
        source = parent._path != null ? source[parent._path] : source;

        /*
          if source is a dataitem handle differently,
          use path lookup
        */
        if(source && source instanceof DataItem) {
          var pt = TextUtil.join('.',parts,i);
          return _path(source, pt);
        }

        var child = parent.pathmap[parts[i]];

/*
        if(source[parts[i]] == undefined) {
          throw EXCEPTIONS.invalidPathDepth + ': ' + sjs.fname(source.constructor) + '.' + path;
        }
*/
        if(child == null /*|| source[parts[i]] == null*/) {
          if(source && source[parts[i]] instanceof Array) {
            child = new ArrayDataItem(source);
            child._temp = isTemp;
          }
          else {
            child = new DataItem();
            child._temp = isTemp;
            child._isStaged = parent._isStaged;
          }

          child._path = parts[i];
          parent.pathmap[parts[i]] = child;
          child.parent = parent;

/*
          if(source[parts[i]] == undefined) {
            if(parts.length > 1) throw EXCEPTIONS.invalidPathDepth + ' ' + path;
            return child;
          }
*/
        }
        parent = child;
      }
      return parent;
    }


    /**
     * _n - new
     * _u - update
     * _d - delete
    */
  	function _setChangeState(dataItem, _n, _u, _d){
  		if(!dataItem) return dataItem;
        if(!dataItem._updated) dataItem._updated = 0;
  		dataItem._updated+=_u;
  		return dataItem;
  	};

    function _setChildChangeState(dataItem, _n, _u, _d){
  		if(!dataItem) return dataItem;
        if(!dataItem._c_updated) dataItem._c_updated = 0;
  		dataItem._c_updated+=_u;
  		return dataItem;
  	};

  	function _bubbleChange(dataItem,_n,_u,_d){
  		var p = _setChangeState(dataItem,_n,_u,_d);
  		while(p = _setChildChangeState(p.parent,_n,_u,_d));
  	};

    function _bubbleChangeCount(dataItem){
      var p = dataItem;
      p._change++;
      while(p = p.parent){
        p._change++;
      }
    };

  	function _triggerOnChange(){
  		var node = this;
  		while(node != null){
  			if(node.onChange) {
  				node.onChange(this);
  				//break;
  			}
  			node = node.parent;
  		}
  	};

  return {
    DataItem : DataItem, 
    DelegateDataItem : DelegateDataItem, 
    ArrayDataItem : ArrayDataItem, 
  };
});
