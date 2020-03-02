
export interface HttpResponse{
    code:number;
    data:any;
}
export function httpGet(url:string) : Promise<HttpResponse>;
export function httpPost(url:string, data:any) : Promise<HttpResponse>;
export function httpPostForm(url:string, data:any) : Promise<HttpResponse>;