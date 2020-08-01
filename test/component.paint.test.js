class Component {
    
    constructor(){
        this._state = {};
    }

    applyContent(content){
        Object.assign(this._state,content);
        this.paint();
    }

    paint(){

    }
}

describe('Render rest', function() {
    it('Ok', function() {

        var component = new Component();
        component.applyContent({a:'a'});
    });
});