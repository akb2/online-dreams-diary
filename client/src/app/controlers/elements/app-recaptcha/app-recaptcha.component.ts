import { BaseInputDirective } from "@_directives/base-input.directive";
import { environment } from "@_environments/environment";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Optional, Self, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { Subject, mergeMap, skipWhile, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-recaptcha",
  templateUrl: "./app-recaptcha.component.html",
  styleUrls: ["./app-recaptcha.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppRecaptchaComponent extends BaseInputDirective implements OnInit, OnDestroy {


  @ViewChild('container') layout: ElementRef;

  siteKey: string = environment.reCaptchaKey;

  scale: number = 0;
  baseWidth: number = 304;
  baseHeight: number = 78;
  layoutWidth: number = 0;
  layoutHeight: number = 0;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    @Optional() @Self() controlDir: NgControl,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir);
  }

  ngOnInit(): void {
    timer(0, 100)
      .pipe(
        takeWhile(() => !this.layout.nativeElement, true),
        skipWhile(() => !this.layout.nativeElement),
        mergeMap(() => this.screenService.elmResize(this.layout.nativeElement)),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => this.onResize());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Капча пройдена
  onResolved(code: string): void {
    this.control.setValue(code);
  }

  // Капча непройдена
  onError(): void {
    this.control.setValue(null);
  }

  // Изменение размеров экрана
  private onResize(): void {
    this.calculateWidth();
  }





  // Подсчитать ширину капчи
  private calculateWidth(): void {
    this.layoutWidth = this.layout.nativeElement.clientWidth;
    this.scale = this.layoutWidth / this.baseWidth;
    this.layoutHeight = this.baseHeight * this.scale;
    this.changeDetectorRef.detectChanges();
  }
}
