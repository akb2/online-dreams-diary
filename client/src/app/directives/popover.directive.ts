import { WaitObservable } from "@_helpers/rxjs";
import { BackgroundHorizontalPositionV2, BackgroundVerticalPosition } from "@_models/appearance";
import { FlexibleConnectedPositionStrategy, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, concatMap, fromEvent, takeUntil } from "rxjs";





@Directive({
  selector: '[appPopover]'
})

export class PopoverDirective implements OnDestroy {

  @Input() appPopoverTemplate: TemplateRef<any>;
  @Input() originX: BackgroundHorizontalPositionV2 = "start";
  @Input() originY: BackgroundVerticalPosition = "bottom";
  @Input() overlayX: BackgroundHorizontalPositionV2 = "start";
  @Input() overlayY: BackgroundVerticalPosition = "top";

  private overlayRef: OverlayRef;

  private overlayTransparentClass: string = "cdk-overlay-transparent-backdrop";

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    WaitObservable(() => !elementRef?.nativeElement)
      .pipe(
        concatMap(() => fromEvent<MouseEvent>(elementRef.nativeElement, "click")),
        takeUntil(this.destroyed$)
      )
      .subscribe(event => this.onClick(event));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  private onClick(event: MouseEvent) {
    if (this.overlayRef) {
      this.closePopover();
    }
    // Открыть окно
    else {
      this.openPopover();
    }
  }





  // Открыть окно
  private openPopover() {
    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([{
        originX: this.originX,
        originY: this.originY,
        overlayX: this.overlayX,
        overlayY: this.overlayY
      }]);
    const portal: TemplatePortal = new TemplatePortal(this.appPopoverTemplate, this.viewContainerRef);
    // Создание всплывающего элемента
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: this.overlayTransparentClass
    });
    this.overlayRef.attach(portal);
    // Закрытие окна
    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.closePopover());
  }

  // Закрыть окно
  private closePopover() {
    this.overlayRef.dispose();
    this.overlayRef = null;
  }
}
