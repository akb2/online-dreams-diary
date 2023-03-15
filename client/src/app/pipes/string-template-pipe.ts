import { ComponentFactoryResolver, EmbeddedViewRef, Injector, Pipe, PipeTransform, TemplateRef, ViewContainerRef } from "@angular/core";





@Pipe({
  name: "stringTemplate"
})

export class StringTemplatePipe implements PipeTransform {
  transform(template: TemplateRef<any>, object: any): string {
    const viewRef: EmbeddedViewRef<any> = template.createEmbeddedView(object);
    // Update
    viewRef.detectChanges();
    // Finding html code
    const nodes: any[] = viewRef.rootNodes;
    const html: string = nodes
      .map(n => n as Element)
      .filter(({ nodeName }) => nodeName !== "#comment")
      .reduce((o, n) => o + (n.nodeName === "#text" ? n.textContent : n.outerHTML), "");
    // Detach
    viewRef.destroy();
    // Return text
    return html;
  }
}
