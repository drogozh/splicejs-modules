declare class ComponentBase {
    public display():   void
    public onInit():    void
    public onLoaded():  void
    public onDisplay(): void
    public onResize(): void
    public add(component: ComponentBase, location?: string);
    public replace(component: ComponentBase, location?: string);
    public remove(component:ComponentBase,location:string);
}

interface ComponentFactory {
    define<T extends ComponentBase>(template:string,controller:IClass<T>) : Component<T>
}

interface Component<T extends ComponentBase> {
    new (args?: any): T
}

interface IClass<T> {
    new(args:any) : T
} 

interface Factory{
    <T extends ComponentBase>(templateName: string, controller: IClass<T>) : Component<T>
}

export function ComponentFactory(require: Function, scope: any): ComponentFactory;



