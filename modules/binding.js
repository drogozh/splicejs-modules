define([
    'dataitem'
],
function(data){

    var DataItem = data.DataItem;

    var BINDING_TYPES = {
  			SELF 		 : 1
  		/* Look for properties within immediate instance */
  		,	PARENT 		 : 2
  		/* Look for properties within direct parent of the immediate instance*/
  		,	FIRST_PARENT : 3
  		/* Look for properties within a first parent  where property if found */
  		,	ROOT 		 : 4
  		/* Look for properties within a root of the parent chain */
  		,	TYPE 		 : 5
  		/* Indicates type lookup lookup */
        ,   PATH        :  6
        /* named binding */
        ,   NAME        :  7
  	};

    /**
     * 
     */
    function Binding(path,kind){
        this.property = path;
        this.kind = BINDING_TYPES.PATH;
        this.targetType = null;
    }

    Binding.prototype.parent = function(typeName){
        this.targetType = typeName;
        this.kind = BINDING_TYPES.PARENT;
        return this;
    },

    Binding.prototype.name = function(name){
        this.targetName = name;
        this.kind = BINDING_TYPES.NAME;
        return this;
    }  


    /**
     * 
     */
  	Binding.resolveBinding = function resolveBinding(binding, instance, scope){
  	    if(!binding) return;
  		//resolveBinding(binding.prev, instance, key, scope);

  		var source = null;
        var sourceInstance = null;
        //target of the binding
        var target = new DataItem(instance).path(binding.targetProperty);

  		switch(binding.kind){
            case BINDING_TYPES.SELF:
                break;

            case BINDING_TYPES.PARENT:
                if(!instance.parent) throw 'Cannot resolve parent binding, [instance.parent] is null';
                //resolve binding through dataitem
                source = new DataItem(instance.parent).path(binding.prop);
                sourceInstance = instance.parent;
                break;

            case BINDING_TYPES.FIRST_PARENT:
                break;

            case BINDING_TYPES.ROOT:
                break;
            case BINDING_TYPES.TYPE:
                break;
            case BINDING_TYPES.PATH:
                source = new DataItem(instance).path(binding.property);
                break;
            case BINDING_TYPES.NAME:
                source = findBindingInstance(binding,instance);
                break;    
  		} //end switch statement

  		if(!source) throw 'Cannot resolve binding source';

        var sourceValue = source.getValue();
        var sourceInstance = source.getOwner();

        var targetValue = target.getValue();
        var targetInstace = target.getOwner();
      /*
        definition: source is a property reference residing in the controller class
      */



      //1. if source is event, subscribe to it
      if(sourceValue && sourceValue.__sjs_event__ === true &&
        typeof(targetValue) == 'function' && !targetValue.__sjs_event__ ){
        sourceValue.subscribe(targetValue,instance);
        return;
      }

      //2. if target is event subscribe to it
      if(targetValue && targetValue.__sjs_event__ === true &&
        typeof(sourceValue) == 'function'){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      if(targetValue && targetValue.__sjs_event__ &&
         sourceValue && sourceValue.__sjs_event__ ){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      //3.
      if(typeof(targetValue) == 'function' && typeof(sourceValue) != 'function'){
        source.subscribe(targetValue,instance);
        return;
      }

      //4. value to value binding
      target.setValue(sourceValue);

  	}


    function findBindingInstance(binding,instance){
        var parent = instance.parent;
        var target = null;
        while(parent!= null) {
            if(parent._templateName_ == binding.targetName) {
                target = parent;
                break;
            }
            //check is parent's includes

            
            parent = parent.parent;
        }
        return new DataItem(target).path(binding.property);    
    }      




return Binding;

});