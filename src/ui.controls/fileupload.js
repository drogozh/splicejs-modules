define([
    'require',
    '../inheritance',
    '../component',
    '../event',
    '../view',
    '../collections',
    '../network',
    '!fileupload.css',
    '!fileupload.html'
],function(require,inheritance,component,event,element,collections,network){

    var factory = component.ComponentFactory(require,{
    });

    var collection = collections.collection;

    var FileUpload = inheritance.Class(function FileUpload(){
        this._extraFormData = {};
    }).extend(component.ComponentBase);

    FileUpload.prototype.onInit = function(args){
        this.action = args.action;
    };

    FileUpload.prototype.onLoaded = function(){
    };

    FileUpload.prototype.append = function(name, value){
        this._extraFormData[name] = value;
    };

    FileUpload.prototype.upload = function(){
        // build form data
        var files = this.elements.fileSelector.node.files;
        var formData = new FormData();
        collection(files).forEach(function(file){
            formData.append('files',file,file.name)
        });

        collection(this._extraFormData).forEach(function(value,key){
            formData.append(key, value);
        });

        var _this = this;
        return new Promise(function(resolve, reject){
            network.http.post({
                url:_this.action,
                data:formData
            })({
                ok:function(result){
                    resolve(result);
                },
                fail:function(result){
                    reject(result);
                }
            });
        });
    };

    FileUpload.Component = factory.define('FileUpload:fileupload.html', FileUpload);

    return FileUpload;

});