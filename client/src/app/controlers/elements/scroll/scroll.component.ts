import { WaitObservable } from "@_datas/api";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { CustomObject, SimpleObject } from "@_models/app";
import { ScrollAddDimension, ScrollData } from "@_models/screen";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { Observable, Subject, animationFrameScheduler, concatMap, fromEvent, of, tap, timer } from "rxjs";
import { filter, map, observeOn, pairwise, startWith, takeUntil } from "rxjs/operators";





@Component({
  selector: "app-scroll",
  templateUrl: "./scroll.component.html",
  styleUrls: ["./scroll.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ScrollComponent implements OnInit, AfterViewInit, OnDestroy {


  @Input() showCorner: boolean = false;
  @Input() scrolledDistance: number = 100;

  @Output() scrollChange: EventEmitter<ScrollChangeEvent> = new EventEmitter();
  @Output() scrolledToTop: EventEmitter<ScrollChangeEvent> = new EventEmitter();
  @Output() scrolledToBottom: EventEmitter<ScrollChangeEvent> = new EventEmitter();
  @Output() scrolledToLeft: EventEmitter<ScrollChangeEvent> = new EventEmitter();
  @Output() scrolledToRight: EventEmitter<ScrollChangeEvent> = new EventEmitter();

  @ViewChild("list") private listElm: ElementRef<HTMLElement>;
  @ViewChild("trackH") private trackHElm: ElementRef<HTMLElement>;
  @ViewChild("trackV") private trackVElm: ElementRef<HTMLElement>;
  @ViewChild("sliderH") private sliderHElm: ElementRef<HTMLElement>;
  @ViewChild("sliderV") private sliderVElm: ElementRef<HTMLElement>;

  isMobile: boolean = false;
  scrolledX: boolean = false;
  scrolledY: boolean = false;
  private scrollChangeEvent: ScrollChangeEvent;

  private listWidth: number = 0;
  private listHeight: number = 0;
  maxScrollX: number = 0;
  maxScrollY: number = 0;
  private scrollX: number = 0;
  private scrollY: number = 0;

  scrollAddDimension: ScrollAddDimension;
  private scrollAddSize: number = 25;
  private scrollAddSpeed: number = 25;

  scrollMoveDimension: ScrollAddType;
  private scrollMoveStartX: number = 0;
  private scrollMoveStartY: number = 0;

  scrollElmHSize: number = 0;
  scrollElmHPos: number = 0;
  scrollElmVSize: number = 0;
  scrollElmVPos: number = 0;

  private destroyed$: Subject<void> = new Subject();





  // Текущий скролл по оси Y
  private get getCurrentScroll(): ScrollData {
    const elm: HTMLElement = this.listElm.nativeElement;
    const x: number = ParseInt(elm?.scrollLeft);
    const y: number = ParseInt(elm?.scrollTop);
    const maxX: number = ParseInt(elm?.scrollWidth - elm?.clientWidth);
    const maxY: number = ParseInt(elm?.scrollHeight - elm?.clientHeight);
    // Скролл
    return { x, y, maxX, maxY };
  }

  // Подписчик ожидания загрузки элемента
  private getWaitObservable(callback: () => Observable<any> = () => of(null)): Observable<void> {
    return WaitObservable(() => !this.hostElement?.nativeElement || !this.listElm?.nativeElement).pipe(
      takeUntil(this.destroyed$),
      concatMap(callback),
      map(() => { })
    );
  }

  // Стили панели управления
  get listStyles(): SimpleObject {
    return {
      'max-width': this.listWidth + 'px',
      'max-height': this.listHeight + 'px'
    };
  }

  // Список классов панели управления
  get elmsClasses(): CustomObject<boolean> {
    return {
      "show-corner": this.showCorner,
      "scroll-h": this.maxScrollX > 0,
      "scroll-v": this.maxScrollY > 0
    };
  }

  // Посчитать размер слайдера по оси Y
  checkScrollElmHSize(size: number = 0): number {
    const sliderH: HTMLElement = this.sliderHElm?.nativeElement;
    const trackH: HTMLElement = this.trackHElm?.nativeElement;
    // Все элементы определены
    if (!!sliderH && !!trackH) {
      const maxWidth: number = trackH.clientWidth ?? 0;
      const minWidth: number = ParseInt(getComputedStyle(sliderH).minWidth) ?? 0;
      // Проверка размера
      return (CheckInRange(size > 0 ? size : sliderH.clientWidth ?? 0, maxWidth, minWidth) / maxWidth) * 100;
    }
    // Нет скролла
    return 0;
  }

  // Посчитать размер слайдера по оси Y
  checkScrollElmVSize(size: number = 0): number {
    const sliderV: HTMLElement = this.sliderVElm?.nativeElement;
    const trackV: HTMLElement = this.trackVElm?.nativeElement;
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
    private hostElement: ElementRef,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
    // Изменение размеров списка
    WaitObservable(() => !this.listElm?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.screenService.elmResize(this.listElm.nativeElement))
      )
      .subscribe(() => this.onScrollRender());
    // Изменение количества элементов списка
    WaitObservable(() => !this.listElm?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => timer(0, this.scrollAddSpeed)),
        map(() => this.listElm.nativeElement?.childNodes?.length),
        startWith(0),
        pairwise(),
        filter(([prev, next]) => prev !== next),
        map(([, next]) => next)
      )
      .subscribe(() => this.onScrollRender());
    // Передвижение мышки по странице
    fromEvent(window, "mousemove")
      .pipe(
        observeOn(animationFrameScheduler),
        takeUntil(this.destroyed$),
        filter(() => !!this.scrollMoveDimension)
      )
      .subscribe(e => this.onScrollMouseMove(e as MouseEvent));
    // Отпускание нажатия кнопок
    fromEvent(window, "mouseup")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onScrollMouseUp());
    // Мотание скролла по циклу
    timer(0, this.scrollAddSpeed)
      .pipe(
        observeOn(animationFrameScheduler),
        takeUntil(this.destroyed$),
        filter(() => !!this.scrollAddDimension)
      )
      .subscribe(() => this.onAddScroll());
  }

  ngAfterViewInit(): void {
    this.getWaitObservable(() => this.screenService.elmResize(this.hostElement.nativeElement).pipe(tap(([{ element }]) => {
      const datas: DOMRect = element.getBoundingClientRect();
      // Обновить данные
      this.listWidth = Math.max(datas.width, ParseInt(getComputedStyle(element).maxWidth));
      this.listHeight = Math.max(datas.height, ParseInt(getComputedStyle(element).maxHeight));
    })))
      .subscribe(() => this.onScrollRender());
    // Скролл
    this.getWaitObservable(() => fromEvent(this.listElm.nativeElement, "scroll"))
      .pipe(observeOn(animationFrameScheduler))
      .subscribe(() => this.onScrollRender());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Нажатие на слайдер
  onScrollSliderDown(dimension: ScrollAddType, event: MouseEvent): void {
    const sliderElm: HTMLElement = (dimension === "h" ? this.sliderHElm : this.sliderVElm)?.nativeElement;
    // Если элемент существует
    if (!!sliderElm) {
      const sliderData: DOMRect = sliderElm.getBoundingClientRect();
      // Запомнить данные
      this.scrollMoveDimension = dimension;
      this.scrollMoveStartX = event.pageX - sliderData.x;
      this.scrollMoveStartY = event.pageY - sliderData.y;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Нажатие на кнопку
  onScrollButtonDown(dimension: ScrollAddDimension = null): void {
    this.scrollAddDimension = dimension;
    this.changeDetectorRef.detectChanges();
  }

  // Отпускание кнопки
  onScrollMouseUp(): void {
    this.scrollAddDimension = null;
    this.scrollMoveDimension = null;
    this.changeDetectorRef.detectChanges();
  }

  // Перемещение скролла
  onScrollMouseMove(event: MouseEvent): void {
    if (!!this.scrollMoveDimension) {
      const elm: HTMLElement = this.listElm.nativeElement;
      const scrollData: ScrollData = this.getCurrentScroll;
      const maxScroll: number = this.scrollMoveDimension === "h" ? scrollData.maxX : scrollData.maxY;
      const trackElm: HTMLElement = (this.scrollMoveDimension === "h" ? this.trackHElm : this.trackVElm)?.nativeElement;
      const sliderElm: HTMLElement = (this.scrollMoveDimension === "h" ? this.sliderHElm : this.sliderVElm)?.nativeElement;
      // Если елемент существует
      if (!!trackElm && !!sliderElm) {
        const trackData: DOMRect = trackElm.getBoundingClientRect();
        const sliderData: DOMRect = sliderElm.getBoundingClientRect();
        const shift: number = this.scrollMoveDimension === "h" ?
          event.pageX - this.scrollMoveStartX - trackData.x :
          event.pageY - this.scrollMoveStartY - trackData.y;
        const trackSize: number = this.scrollMoveDimension === "h" ? trackElm.clientWidth : trackElm.clientHeight;
        const trackAvailSize: number = trackSize - (this.scrollMoveDimension === "h" ? sliderData.width : sliderData.height);
        const newScroll: number = CheckInRange((shift / trackAvailSize) * maxScroll, maxScroll, 0);
        // Скроллинг
        this.scrollMoveDimension === "h" ?
          elm.scrollTo({ left: newScroll, behavior: "auto" }) :
          elm.scrollTo({ top: newScroll, behavior: "auto" });
      }
    }
  }

  // Скролл по направлению
  private onAddScroll(): void {
    if (!!this.scrollAddDimension) {
      const elm: HTMLElement = this.listElm.nativeElement;
      const scrollType: ScrollAddType = this.scrollAddDimension === "left" || this.scrollAddDimension === "right" ? "h" : "v";
      const scrollData: ScrollData = this.getCurrentScroll;
      const scroll: number = scrollType === "h" ? scrollData.x : scrollData.y;
      const maxScroll: number = scrollType === "h" ? scrollData.maxX : scrollData.maxY;
      const addScroll: number = this.scrollAddDimension === "left" || this.scrollAddDimension === "top" ? -this.scrollAddSize : this.scrollAddSize;
      const newScroll: number = CheckInRange(scroll + addScroll, maxScroll, 0);
      // Скроллинг
      scrollType === "h" ?
        elm.scrollTo({ left: newScroll, behavior: "auto" }) :
        elm.scrollTo({ top: newScroll, behavior: "auto" });
    }
  }

  // Рендер скролла
  private onScrollRender(): void {
    const scrollData: ScrollData = this.getCurrentScroll;
    const listElm: HTMLElement = this.listElm.nativeElement;
    const scrollChangeEvent: ScrollChangeEvent = {
      ...scrollData,
      viewWidth: listElm.clientWidth,
      viewHeight: listElm.clientHeight,
    };
    // Обновить переменные
    this.maxScrollX = scrollData.maxX;
    this.maxScrollY = scrollData.maxY;
    this.scrollX = scrollData.x;
    this.scrollY = scrollData.y;
    this.scrollElmHSize = this.checkScrollElmHSize((listElm.clientWidth / listElm.scrollWidth) * 100);
    this.scrollElmVSize = this.checkScrollElmVSize((listElm.clientHeight / listElm.scrollHeight) * 100);
    this.scrollElmHPos = (this.scrollX / this.maxScrollX) * (100 - this.scrollElmHSize);
    this.scrollElmVPos = (this.scrollY / this.maxScrollY) * (100 - this.scrollElmVSize);
    // Событие изменения скролла
    if (!CompareObjects(this.scrollChangeEvent, scrollChangeEvent)) {
      this.scrollChange.emit(scrollChangeEvent);
      // Заблокировать для инициализирующего вызова
      if (!!this.scrollChangeEvent) {
        const toTop: boolean = scrollChangeEvent.y <= this.scrolledDistance && scrollChangeEvent.y < this.scrollChangeEvent.y;
        const toBottom: boolean = scrollChangeEvent.y >= scrollChangeEvent.maxY - this.scrolledDistance && scrollChangeEvent.y > this.scrollChangeEvent.y;
        const noScrollY: boolean = !toTop && !toBottom && scrollChangeEvent.y === 0 && scrollChangeEvent.maxY === 0 && scrollChangeEvent.viewHeight > 0;
        const toLeft: boolean = scrollChangeEvent.x <= this.scrolledDistance && scrollChangeEvent.x < this.scrollChangeEvent.x;
        const toRight: boolean = scrollChangeEvent.x >= scrollChangeEvent.maxX - this.scrolledDistance && scrollChangeEvent.x > this.scrollChangeEvent.x;
        const noScrollX: boolean = !toLeft && !toRight && scrollChangeEvent.x === 0 && scrollChangeEvent.maxX === 0 && scrollChangeEvent.viewWidth > 0;
        // Достигнут предел скролла Y
        if (!this.scrolledY && (toTop || toBottom || noScrollY)) {
          this.scrolledY = true;
          // Верх
          if (toTop) {
            this.scrolledToTop.emit(scrollChangeEvent);
          }
          // Низ
          else if (toBottom || noScrollY) {
            this.scrolledToBottom.emit(scrollChangeEvent);
          }
        }
        // Сбросить отметку для X
        else if (this.scrolledY && !toTop && !toBottom && !noScrollY) {
          this.scrolledY = false;
        }
        // Достигнут предел скролла X
        if (!this.scrolledX && (toLeft || toRight || noScrollX)) {
          this.scrolledX = true;
          // Верх
          if (toLeft) {
            this.scrolledToLeft.emit(scrollChangeEvent);
          }
          // Низ
          else if (toRight || noScrollX) {
            this.scrolledToRight.emit(scrollChangeEvent);
          }
        }
        // Сбросить отметку для X
        else if (this.scrolledX && !toLeft && !toRight && !noScrollX) {
          this.scrolledX = false;
        }
      }
      // Запомнить настройки
      this.scrollChangeEvent = scrollChangeEvent;
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }
}





// Интерфейс состояния скролла
export interface ScrollChangeEvent extends ScrollData {
  viewWidth: number;
  viewHeight: number;
}

// Тип скролла
type ScrollAddType = "v" | "h";
