# Template Composition
Default content is not set, because root "div" will contain and "include" child
```html
<div class="-sub-label">
    <include sjs-type="Controls.Button"></include>
</div>
```
Default content is set, because root "div" is empty, since text node is not considered a child-element
```html
<div class="-sub-label">
    Hello World!
</div>
```

# Setting content
## Inline template markup

When "setting" JSON property to an HTML markup, such as shown below on the second nested "content" property. System converts the markup to component with ComponentBase view-model and template as specified by the markup.
Tempalte elements may be decorated with sjs-content attributes. 
```html
<include sjs-type="Controls.Button" sjs-parent-content="subtitle">
{
    content:<include sjs-type="Controls.CheckBox" sjs-parent-content="default" >
            {
                content:<div sjs-parent-content="default" sjs-content="default" class="-sub-label">
                            <include sjs-type="Controls.Button"></include>
                        </div>
            }
            </include>      
}
</include>
```

# Binding
```html
<include sjs-type="Controls.Button" sjs-parent-content="subtitle">
{
   onClick:binding('buttonClicked').parent
}
</include>
```

# Gotchas
Using a component inside the same type of component ie recursive nesting

As shown below, one CheckBox includes another checkbox 
```html
<include sjs-type="Controls.Button" sjs-override="subtitle">
{
    content:<include sjs-type="Controls.CheckBox" sjs-override="default" >
            {
                isChecked:true,
                content:<div sjs-override="default"  class="-sub-label">
                            <include sjs-type="Controls.Button" sjs-override="default">
                            {
                                content:'test',
                                onClick:binding('buttonClicked').name('SampleApplication')
                            }
                            </include>
                            <include sjs-type="Controls.CheckBox"> 
                            {
                                isChecked:true
                            }
                            </include>
                        </div>
            }
            </include>      
}
</include>
```


```javascript
function ComponentFactory(require,scope){
    return {define:function(template,controller,defaultArgs,p){
        var parts = template.split(":");
        var listener = new Listener();
        listener.p = p;
        scope[utils.functionName(controller)] = controller;
        require('!'+[parts[1]],function(t){
            listener.loaded(t,scope);
        });
        return function Component(args,parent){
            args = utils.blend(defaultArgs,args);
            var comp = new controller(args,parent);
                comp.parent = parent;
                comp.__name__ = parts[0]; 
                comp.init(args);
                comp.resolve(args,parent);
            //when component type is nested within itself
            //the compnent constuctor will run inside template
            //loading handler which is triggered by the parent
            //component of the same type
            //thus it is necessary to set listener.isLoaded= true
            //before running onload handler    
            if(!listener.isLoaded){
                listener.subscribe((function(t){
                    this.loaded(t[parts[0]],scope)
                }).bind(comp));
            } else {
                // component is created
                comp.loaded(listener.t[parts[0]],scope);
            }
            return comp;
        }
    }
}
}
```