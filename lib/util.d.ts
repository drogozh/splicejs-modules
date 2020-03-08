export function filter<T>(collection:T[],callback:(args:any)=>any) : T[];
export function unique<T>(collection:T[],callback:(args:T) => T): T[];