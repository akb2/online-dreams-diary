import { WaitObservable } from "@_helpers/rxjs";
import { DrawDatas } from "@_helpers/draw-datas";
import { NumberDirection } from "@_models/math";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject, map, merge, mergeMap, takeUntil } from "rxjs";





@Directive({
  selector: "[scrollDetector]"
})

export class ScrollDetectorDirective implements OnInit, OnDestroy {

  @Input() detectDirection: NumberDirection = 0;

  @Output() inScreenEvent: EventEmitter<void> = new EventEmitter();
  @Output() outOfScreenEvent: EventEmitter<void> = new EventEmitter();

  private inScreen: boolean = false;
  private scroll: number = 0;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private elementRef: ElementRef,
    private screenService: ScreenService,
    private scrollService: ScrollService
  ) { }

  ngOnInit(): void {
    this.checkVisibility();
    // Прослушивание событий
    WaitObservable(() => !this.scrollService.getCurrentScroll?.elm)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => this.scrollService.getCurrentScroll.elm),
        mergeMap(elm => merge(this.scrollService.onAlwaysScroll(), this.screenService.elmResize(elm)))
      )
      .subscribe(() => this.checkVisibility());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Проверка элемента
  private checkVisibility(): void {
    const domRect: DOMRect = this.elementRef.nativeElement.getBoundingClientRect();
    const scroll: number = this.scrollService.getCurrentScroll.y;
    const elmPositionTop: number = scroll + domRect.top;
    const elmPositionBottom: number = elmPositionTop + domRect.height;
    const screenPositionTop: number = scroll + DrawDatas.minHeight;
    const screenPositionBottom: number = scroll + window.innerHeight;
    const inScreen: boolean = elmPositionBottom > screenPositionTop && elmPositionTop < screenPositionBottom;
    const scrollDirection: NumberDirection = scroll > this.scroll ? 1 : (scroll < this.scroll ? -1 : 0);
    // Элемент попал в экран
    if (!this.inScreen && inScreen) {
      this.inScreen = true;
      // Проверка направления для вызова события
      if (this.detectDirection === scrollDirection || this.detectDirection === 0) {
        this.inScreenEvent.emit();
      }
    }
    // Элемент покинул экран
    else if (this.inScreen && !inScreen) {
      this.inScreen = false;
      // Проверка направления для вызова события
      if ((this.detectDirection !== scrollDirection && scrollDirection !== 0 && this.detectDirection !== 0) || this.detectDirection === 0) {
        this.outOfScreenEvent.emit();
      }
    }
    // Запомнить новый скролл
    this.scroll = scroll;
  }
}
