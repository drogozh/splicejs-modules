export class DataItem<T> {
    constructor(value:T);
    path<P>(key:string):DataItem<P>;
    getValue():T;
    setValue(value:T);
    reset();
}
