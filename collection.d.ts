export class Grouping<TKey, TValue>{
    key: TKey;
    value: Array<TValue>;
} 

export interface Collection<T> {
    toArray(): Array<T>;
    where(filter:(item:T) => boolean): Collection<T>;
    select<TResult>(selector:(item:T) => TResult): Collection<TResult>;
    selectMany<TResult>(selector:(item:T) => TResult): Collection<TResult>;
    groupBy<TKey>(func:(item:T) => TKey): Collection<Grouping<TKey,T>>;
    min<TResult>(func?:(item:T) => TResult ):TResult | T;
    max<TResult>(func?:(item:T) => TResult ):TResult | T;
    forEach(func:(item:T, key:string) => void): void;
}

export function collection(data:string):Collection<string>;
export function collection<T>(data:Array<T>):Collection<T>;
export function collection(data:number):Collection<number>;
export function collection(data:object):Collection<object>;
