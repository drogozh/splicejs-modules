import { ComponentBase, Component } from '../component';
import { Event } from '../events';
export default class TextField extends ComponentBase {
    public static Component: Component<TextField>;
    public onChange: Event;
}

