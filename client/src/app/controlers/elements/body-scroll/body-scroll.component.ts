import { PageComponentElement, ScrollElement } from "@_datas/app";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { SimpleObject } from "@_models/app";
import { ScrollAddDimension, ScrollData } from "@_models/screen";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subject, forkJoin, fromEvent, of, timer } from "rxjs";
import { concatMap, filter, takeUntil, tap } from "rxjs/operators";





@Component({
  selector: "app-body-scroll",
  templateUrl: "./body-scroll.component.html",
  styleUrls: ["./body-scroll.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BodyScrollComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {


  @Input() styles: SimpleObject;
  @Input() headerHeight: number = 0;

  @ViewChild("layout") layout: ElementRef;
  @ViewChild("track") track: ElementRef;
  @ViewChild("slider") slider: ElementRef;

  sliderPosition: number = 0;
  sliderHeight: number = 0;
  private scrollAddSize: number = 25;
  private scrollAddSpeed: number = 25;

  sliderMousePosY: number = 0;
  scrollActive: boolean = false;
  sliderMousePress: boolean = false;
  scrollAddDimension: ScrollAddDimension;

  isMobile: boolean = false;

  private destroyed$: Subject<void> = new Subject<void>();





  // Посчитать размер слайдера по оси Y
  checkScrollElmSize(size: number = 0): number {
    const sliderV: HTMLElement = this.slider?.nativeElement;
    const trackV: HTMLElement = this.track?.nativeElement;
    // Все элементы определены
    if (!!sliderV && !!trackV) {
      const maxHeight: number = trackV.clientHeight ?? 1;
      const currentHeight: number = ((sliderV.clientHeight ?? 0) / maxHeight) * 100;
      const minHeight: number = ((ParseInt(getComputedStyle(sliderV).minHeight) ?? 0) / maxHeight) * 100;
      // Проверка размера
      return CheckInRange(size > 0 ? size : currentHeight, 100, minHeight);
    }
    // Нет скролла
    return 0;
  }





  constructor(
    private screenService: ScreenService,
    private scrollService: ScrollService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges() {
    this.onWindowScroll();
  }

  ngOnInit() {
    this.onWindowScroll();
    // События
    of({ scrollElement: ScrollElement(), pageComponentElement: PageComponentElement() })
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(({ scrollElement, pageComponentElement }) => forkJoin([
          this.screenService.elmResize(document.body).pipe(tap(() => this.onWindowScroll())),
          this.scrollService.onAlwaysScroll().pipe(tap(() => this.onWindowScroll())),
          this.screenService.elmResize([scrollElement, pageComponentElement]).pipe(tap(() => this.onWindowScroll())),
          fromEvent(window, "mouseup").pipe(tap(e => this.onMouseUp(e as MouseEvent))),
          fromEvent(window, "mousemove").pipe(tap(e => this.onMouseMove(e as MouseEvent)))
        ])),
      )
      .subscribe();
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
    // Мотание скролла по циклу
    timer(0, this.scrollAddSpeed)
      .pipe(
        takeUntil(this.destroyed$),
        filter(() => !!this.scrollAddDimension)
      )
      .subscribe(() => this.onAddScroll());
  }

  ngAfterViewChecked(): void {
    this.onWindowScroll();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Скролл страницы
  onWindowScroll(): void {
    const scrollData: ScrollData = this.scrollService.getCurrentScroll;
    // Элемент скролла отрисован
    if (!!scrollData.elm) {
      const screenHeight: number = scrollData.elm.clientHeight - this.headerHeight;
      const scrollHeight: number = scrollData.maxY + screenHeight;
      // Активность скролла
      this.scrollActive = screenHeight < scrollHeight;
      this.changeDetectorRef.detectChanges();
      // Отрисовка позиций скролла
      if (this.scrollActive && !this.isMobile) {
        this.sliderHeight = this.checkScrollElmSize((screenHeight / scrollHeight) * 100);
        this.sliderPosition = (scrollData.y / scrollData.maxY) * (100 - this.sliderHeight);
      }
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Фокус внутри слайдера
  onSliderMouseDown(event: MouseEvent): void {
    const sliderElm: HTMLElement = this.slider?.nativeElement;
    // Если элемент существует
    if (!!sliderElm) {
      const sliderData: DOMRect = sliderElm.getBoundingClientRect();
      // Запомнить данные
      this.sliderMousePress = true;
      this.sliderMousePosY = event.pageY - sliderData.y;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Движение мышкой
  onMouseMove(event: MouseEvent): void {
    if (this.sliderMousePress) {
      const scrollData: ScrollData = this.scrollService.getCurrentScroll;
      const maxScroll: number = scrollData.maxY;
      const trackElm: HTMLElement = this.track?.nativeElement;
      const sliderElm: HTMLElement = this.slider?.nativeElement;
      // Если елемент существует
      if (!!trackElm && !!sliderElm) {
        const trackData: DOMRect = trackElm.getBoundingClientRect();
        const sliderData: DOMRect = sliderElm.getBoundingClientRect();
        const shift: number = event.pageY - this.sliderMousePosY - trackData.y;
        const trackSize: number = trackElm.clientHeight;
        const trackAvailSize: number = trackSize - sliderData.height;
        const newScroll: number = CheckInRange((shift / trackAvailSize) * maxScroll, maxScroll, 0);
        // Скроллинг
        this.scrollService.scrollToY(newScroll, "auto", false);
      }
    }
  }

  // Фокус внутри кнопки
  onButtonMouseDown(dimension: ScrollAddDimension): void {
    this.scrollAddDimension = dimension;
  }

  // Потеря фокуса любым элементом
  onMouseUp(event: MouseEvent): void {
    this.sliderMousePress = false;
    this.scrollAddDimension = null;
  }

  // Скролл по направлению
  private onAddScroll(): void {
    if (!!this.scrollAddDimension) {
      const { y: scroll, maxY: maxScroll }: ScrollData = this.scrollService.getCurrentScroll;
      const addScroll: number = this.scrollAddDimension === "top" ? -this.scrollAddSize : this.scrollAddSize;
      const newScroll: number = CheckInRange(scroll + addScroll, maxScroll, 0);
      // Скроллинг
      this.scrollService.scrollToY(newScroll, "auto", false);
    }
  }
}
