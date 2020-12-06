export function filter<T>(collection:T[],callback:(args:any)=>any) : T[];
export function unique<T>(collection:T[],callback:(args:T) => T): T[];
export function assign(...objects:any):any;
export namespace Text {
    export function capitalize(text:string): string;
}