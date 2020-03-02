export function run(action:()=>void, timeout?:number);
export class Promise<T> {
    constructor(callback:(resolve:(result:T)=> void, reject:(error:any) => void) => void);
    then<U>(onResolve:(result:T) => U): Promise<U>;
    catch(onError:(error:any) => void);
}
