define({
imports:[
  {Inheritance  : '/{splice.modules}/splice.Inheritance.js'},
  {Core         : '/{splice.modules}/splice.component.core.js'}
  //, {Controls     : '/{splice.modules}/modules/splice.component.controls.js'}
],
definition:function(require){

  var scope = this;

  var imports = scope.imports;

  var Class = imports.Inheritance.Class
  ,   ComponentTemplate = imports.Core.Template
  ,   Controller = imports.Core.Controller
  ;

  
  
  var DocumentApplication = Class(function DocumentApplication(document,scope){
    this.scope = scope;
    this.document = document;
    if(!this.scope.components)
      this.scope.components = scope.imports.$js.namespace();
  });

  DocumentApplication.prototype.run =  function(){
    var bodyTemplate = new ComponentTemplate(this.document.body);
    bodyTemplate.compile(this.scope);
    var controller = new Controller();
    bodyTemplate.processIncludeAnchors(this.document.body,controller,this.scope);
    controller.onDisplay();
  };


  var Component = Class(function Component(){
    
  });



  scope.exports(
    DocumentApplication, 
    Controller,
    Component, 
    imports.Core.defineComponents
  );
}});
