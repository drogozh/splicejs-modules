import {Element} from './view';
export class ComponentBase {
    constructor(parent:ComponentBase,args?:any);
    node:HTMLElement;
    getElement(name:string): Element;
    getComponent<T>(name:string): T;
    applyContent(content:any): void;
    reflow(x?:number,y?:number,w?:number,h?:number,b?:boolean);
    addFormatter(name:string, formatter:any);
}

export interface Component<T extends ComponentBase> {
    new(parent?:ComponentBase,args?:any): T;
}

export class ComponentFactory {
    constructor(require:any, scope:any);
    define<T extends ComponentBase>(templateName:string, viewModel:new(parent:ComponentBase,args?:any)=>ComponentBase): Component<T>;
}
