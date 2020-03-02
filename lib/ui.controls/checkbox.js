define([
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../dom.events',
    '../view',
    '../dataitem',
    '!checkbox.css',
    '!checkbox.html'
],function(require,inheritance,component,event,domEvents,dom,dataApi){

    var Class = inheritance.Class
    ,   DataItem = dataApi.DataItem;

    //component factory
    var factory = component.ComponentFactory(require,{});

    /**
     * CheckBox Component
     */
    var CheckBox = Class(function CheckBox(args){
    }).extend(component.ComponentBase);

    CheckBox.prototype.onInit = function(args){
        this.isChecked = args.isChecked || false;
        event.attach(this,{
            onChanged:event.MulticastEvent
        });
    };

    CheckBox.Component = factory.define('CheckBox:checkbox.html',CheckBox),

    CheckBox.prototype.applyContent = function(content){
        if(typeof(content) == 'boolean'){
            this.check(content);
            return;
        }

        if(content instanceof DataItem){
            this._data = content;
            this.check(this._data.getValue());
        }
    };

    CheckBox.prototype.onLoaded = function(){

        new domEvents.OnClick()
            .attach(this.elements.root.node)
            .subscribe(function(){
                this.isChecked = !this.isChecked;
                if(this._data != null) {
                    this._data.setValue(this.isChecked);
                    this.check(this._data.getValue());
                }
                this.onChanged(this.isChecked);
            },this);
    };

    CheckBox.prototype.check = function(isChecked){
        //set class to reflect the state
        if(isChecked == true){
            this.elements.root.addClass('checked');
        } else {
            this.elements.root.removeClass('checked');
        }
        this.isChecked = isChecked;
        this.onChanged(this);
    }

    return CheckBox;

});