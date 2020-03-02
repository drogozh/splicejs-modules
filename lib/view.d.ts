import {Event, Subscription} from './events';

export class Element {
    constructor(eleemnt:HTMLElement);
    node:HTMLElement;
    show():void;
    hide():void;
    addClass(className:string): Element;
    removeClass(className:string): Element;
    getParent(elementName:string, className?:string);
    appendClass(className:string):Element;
    removeClass(className:string):Element;
}

type ElementEventArgs = {
    source: HTMLElement;
};

interface ElementEvent {
    new(element:Element):Event<ElementEventArgs>;
}

export var UnicastMouseDownEvent : ElementEvent;
export var UnicastClickEvent: ElementEvent;
export var MulticastMouseDownEvent: ElementEvent;
export var MulticastClickEvent: ElementEvent;
