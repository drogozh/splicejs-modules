import * as network from "./modules/splice.network";
import * as async from "./modules/splice.async";
import * as component from "./modules/splice.component";

export namespace Network {
export class HttpRequest {
    public static get(url: string) {
        network.http.get({ url: url });
    }

    public static post(url:string) {
        network.http.post({ url: url });
    }
}
}

export namespace Async {
    export var loop = async.asyncLoop;
}

export namespace Component {
    export var Component = component.Controller;
}