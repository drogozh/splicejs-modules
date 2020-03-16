export class Grouping<TKey, TValue>{
    key: TKey;
    value: Array<TValue>;
} 

export interface ICollection<T> {    
    toArray(): Array<T>;
    where(filter:(item:T) => boolean): ICollection<T>;
    select<TResult>(selector:(item:T) => TResult): ICollection<TResult>;
    selectMany<TResult>(selector:(item:T) => TResult): ICollection<TResult>;
    groupBy<TKey>(func:(item:T) => TKey): ICollection<Grouping<TKey,T>>;
    min<TResult>(func?:(item:T) => TResult ):TResult | T;
    max<TResult>(func?:(item:T) => TResult ):TResult | T;
    forEach(func:(item:T, key:string) => void): void;
}

interface CollectionConstuctor {
    new(data:string) : ICollection<string>;
    new<T>(data:Array<T>) : ICollection<T>;
    new(data:number): ICollection<number>;
    new<T>(data:{[key:string]:T}): ICollection<T>;
}

export var Collection : CollectionConstuctor;

