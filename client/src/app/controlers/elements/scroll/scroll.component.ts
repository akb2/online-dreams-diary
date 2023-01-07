import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { SimpleObject } from "@_models/app";
import { ScreenService } from "@_services/screen.service";
import { forkJoin, fromEvent, merge, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";





@Component({
  selector: "app-scroll",
  templateUrl: "./scroll.component.html",
  styleUrls: ["./scroll.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ScrollComponent implements OnInit, OnChanges, OnDestroy {


  @Input() styles: SimpleObject;
  @Input() headerHeight: number = 0;

  @ViewChild("layout") layout: ElementRef;
  @ViewChild("track") track: ElementRef;
  @ViewChild("slider") slider: ElementRef;

  sliderPosition: number = 0;
  sliderHeight: number = 0;
  private scrollStep: number = 20;
  private checkInterval: number = 150;

  sliderMousePosY: number = 0;
  scrollActive: boolean = false;
  sliderMousePress: boolean = false;
  buttonMousePress: boolean = false;

  isMobile: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  // Высота документа для скролла
  private get scrollHeight(): number {
    return this.getCurrentScroll.maxY - this.headerHeight;
  }

  // Текущий скролл по оси Y
  private get getCurrentScroll(): ScrollData {
    const x: number = Math.ceil(document?.scrollingElement?.scrollLeft ?? window.scrollX ?? 0);
    const y: number = Math.ceil(document?.scrollingElement?.scrollTop ?? window.scrollY ?? 0);
    const maxElms: HTMLElement[] = [document.body, document.documentElement];
    const maxKeysX: (keyof HTMLElement)[] = ["scrollWidth", "offsetWidth", "clientWidth"];
    const maxKeysY: (keyof HTMLElement)[] = ["scrollHeight", "offsetHeight", "clientHeight"];
    const maxX = Math.max(...maxElms.map(e => maxKeysX.map(k => typeof e[k] === "number" ? e[k] as number : 0)).reduce((o, v) => ([...o, ...v]), []));
    const maxY = Math.max(...maxElms.map(e => maxKeysY.map(k => typeof e[k] === "number" ? e[k] as number : 0)).reduce((o, v) => ([...o, ...v]), []));
    // Скролл
    return { x, y, maxX, maxY };
  }





  constructor(
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges() {
    this.onWindowScroll();
  }

  ngOnInit() {
    this.onWindowScroll();
    // События
    forkJoin([
      this.screenService.elmResize(document.body).pipe(tap(() => this.onWindowScroll())),
      fromEvent(window, "scroll").pipe(tap(() => this.onWindowScroll())),
      fromEvent(window, "resize").pipe(tap(() => this.onWindowScroll())),
      fromEvent(window, "mouseup").pipe(tap(e => this.onMouseUp(e as MouseEvent))),
      fromEvent(window, "mousemove").pipe(tap(e => this.onMouseMove(e as MouseEvent)))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Скролл страницы
  onWindowScroll(): void {
    this.scrollActive = window.innerHeight < this.scrollHeight + this.headerHeight;
    // Отрисовка позиций скролла
    if (this.scrollActive && !this.isMobile) {
      const trackHeight: number = this.track?.nativeElement.getBoundingClientRect().height ?? 0;
      const screenHeight: number = this.layout?.nativeElement.getBoundingClientRect().height ?? 0;
      this.sliderHeight = (screenHeight / this.scrollHeight) * trackHeight;
      this.sliderPosition = (this.getCurrentScroll.y / this.scrollHeight) * trackHeight;
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Фокус внутри слайдера
  onSliderMouseDown(event: MouseEvent): void {
    this.sliderMousePosY = event.y - this.slider.nativeElement.getBoundingClientRect().top;
    // Включить обнаружение движения мышкой
    this.sliderMousePress = true;
  }

  // Движение мышкой
  onMouseMove(event: MouseEvent): void {
    if (this.sliderMousePress) {
      const pageY: number = event.y - this.track.nativeElement.getBoundingClientRect().top - this.sliderMousePosY;
      const maxY: number = this.track.nativeElement.getBoundingClientRect().height;
      window.scroll(0, (pageY / maxY) * this.scrollHeight);
    }
  }

  // Фокус внутри кнопки
  onButtonMouseDown(direction: -1 | 1, setIndicator?: boolean): void {
    if (
      window.innerHeight - this.headerHeight <= this.layout?.nativeElement.getBoundingClientRect().height ||
      (this.getCurrentScroll.y == 0 && direction > 0)
    ) {
      // Установить индикатор нажатия
      if (setIndicator) {
        this.buttonMousePress = true;
      }
      // Прокрутить
      if (this.buttonMousePress) {
        window.scroll(0, this.getCurrentScroll.y + (this.scrollStep * direction));
        setTimeout(() => this.onButtonMouseDown(direction), 80);
      }
    }
  }

  // Потеря фокуса любым элементом
  onMouseUp(event: MouseEvent): void {
    this.sliderMousePress = false;
    this.buttonMousePress = false;
  }
}





// Интерфейс данных скролла
interface ScrollData {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
}
