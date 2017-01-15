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