declare class ComponentBase {
    public display():   void
    public onInit():    void
    public onLoaded():  void
    public onDisplay(): void
    public onResize(): void
    public addContent(component: ComponentBase, location: string);
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

export function ComponentFactory(require: Function, scope: any): Factory;



