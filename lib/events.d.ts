export interface Subscription {
    enable(isEnabled:boolean):Subscription;    
}

export interface Event<T = any> {  
    (args?:T) : void;
    subscribe(callback:(args?:T) => void) : Subscription;
    unsubscribe(subscription:Subscription): void;
    dispose():void;
}

interface  EventConstructor<T=any> {
    new() : Event<T>
}

export var UnicastEvent :EventConstructor;
export var MulticastEvent :EventConstructor;

