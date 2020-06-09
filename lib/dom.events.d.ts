import {Event} from './events';
import {Element} from './view';

interface DomEventArgs {
    element:Element;
}

interface  DomEventConstructor {
    new(element:Element) : Event<DomEventArgs>
}

export var OnClickEvent: DomEventConstructor;