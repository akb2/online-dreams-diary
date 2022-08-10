import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { SimpleObject } from "@_models/app";
import { ScreenService } from "@_services/screen.service";
import { Subject, timer } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-scroll",
  templateUrl: "./scroll.component.html",
  styleUrls: ["./scroll.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ScrollComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {


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
  get scrollHeight(): number {
    return Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    ) - this.headerHeight;
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
    window.addEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.addEventListener("resize", this.onWindowScroll.bind(this), true);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), true);
    window.addEventListener("mousemove", this.onMouseMove.bind(this), true);
    // Проверка изменений скролла
    timer(0, this.checkInterval).pipe(takeUntil(this.destroy$)).subscribe(() => this.onWindowScroll());
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngAfterViewChecked() {
    this.onWindowScroll();
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // События
    window.removeEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.removeEventListener("resize", this.onWindowScroll.bind(this), true);
    window.removeEventListener("mouseup", this.onMouseUp.bind(this), true);
    window.removeEventListener("mousemove", this.onMouseMove.bind(this), true);
  }





  // Скролл страницы
  onWindowScroll(event?: Event): void {
    this.scrollActive = window.innerHeight < this.scrollHeight + this.headerHeight;
    // Отрисовка позиций скролла
    if (this.scrollActive && !this.isMobile) {
      const trackHeight: number = this.track?.nativeElement.getBoundingClientRect().height || 0;
      const screenHeight: number = this.layout?.nativeElement.getBoundingClientRect().height || 0;
      this.sliderHeight = (screenHeight / this.scrollHeight) * trackHeight;
      this.sliderPosition = (window.scrollY / this.scrollHeight) * trackHeight;
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
    if (window.innerHeight - this.headerHeight <= this.layout?.nativeElement.getBoundingClientRect().height || (window.scrollY == 0 && direction > 0)) {
      // Установить индикатор нажатия
      if (setIndicator) {
        this.buttonMousePress = true;
      }
      // Прокрутить
      if (this.buttonMousePress) {
        window.scroll(0, window.scrollY + (this.scrollStep * direction));
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
