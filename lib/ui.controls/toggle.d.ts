import { ComponentBase, Component } from '../component';
import { Event } from '../events';
export default class Toggle extends ComponentBase {
    public static Component: Component<Toggle>;
    public onChange:Event<boolean>;
}