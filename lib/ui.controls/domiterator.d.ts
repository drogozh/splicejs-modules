import {ComponentBase, Component} from '../component';
import {Event} from '../events';

export default class DomIterator extends ComponentBase {
    static Component: Component<DomIterator>;
    onDataUpdated: Event;
    formatter:(item:any) => any;
}

export interface ItemSelectedEventArgs {
    data: any
}