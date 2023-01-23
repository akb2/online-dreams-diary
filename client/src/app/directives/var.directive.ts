import { Directive, Input, TemplateRef, ViewContainerRef } from "@angular/core";





@Directive({
  selector: '[ngVar]',
})

export class VarDirective {


  @Input() set ngVar(context: unknown) {
    this.context.$implicit = context;
    this.context.ngVar = context;
    // Элемент существует
    if (!this.hasView) {
      this.vcRef.createEmbeddedView(this.templateRef, this.context);
      this.hasView = true;
    }
  }

  private context: { $implicit: unknown; ngVar: unknown; } = { $implicit: null, ngVar: null, };
  private hasView: boolean = false;





  constructor(
    private templateRef: TemplateRef<any>,
    private vcRef: ViewContainerRef
  ) { }
}
