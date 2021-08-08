import { OnInit, Component, ElementRef, Input, OnDestroy, ViewChild, AfterViewChecked, OnChanges, ChangeDetectorRef } from "@angular/core";
import { ScreenService } from "@_services/screen.service";





@Component({
  selector: "app-scroll",
  templateUrl: "./scroll.component.html",
  styleUrls: ["./scroll.component.scss"]
})
export class ScrollComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {


  @Input() public styles: string;
  @Input() public breakpointMobile: string = "small";
  @Input() public headerHeight: number = 0;

  @ViewChild("layout") public layout: ElementRef;
  @ViewChild("track") public track: ElementRef;
  @ViewChild("slider") public slider: ElementRef;

  public sliderPosition: number = 0;
  public sliderHeight: number = 0;
  private scrollStep: number = 20;

  public sliderMousePosY: number = 0;
  public scrollActive: boolean = false;
  public sliderMousePress: boolean = false;
  public buttonMousePress: boolean = false;

  // Высота документа для скролла
  get scrollHeight(): number {
    return Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    ) - this.headerHeight;
  }

  // Проверить мобильный ли экран
  get isMobile(): boolean {
    return this.screenService.getMax(this.breakpointMobile) >= window.innerWidth;
  }

  // Конструктор
  constructor(
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
  }





  // Элементы страницы отрисованы
  public ngOnInit(): void {
    this.onWindowScroll();
    window.addEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.addEventListener("resize", this.onWindowScroll.bind(this), true);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), true);
    window.addEventListener("mousemove", this.onMouseMove.bind(this), true);
  }

  // После загрузки элементов страницы
  public ngAfterViewChecked(): void {
    this.onWindowScroll();
    this.changeDetectorRef.detectChanges();
  }

  // При получении изменений
  public ngOnChanges(): void {
    this.onWindowScroll();
  }

  // Завершение класса
  public ngOnDestroy(): void {
    window.removeEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.removeEventListener("resize", this.onWindowScroll.bind(this), true);
    window.removeEventListener("mouseup", this.onMouseUp.bind(this), true);
    window.removeEventListener("mousemove", this.onMouseMove.bind(this), true);
  }

  // Скролл страницы
  public onWindowScroll(event?: Event): void {
    this.scrollActive = window.innerHeight < this.scrollHeight + this.headerHeight;
    // Отрисовка позиций скролла
    if (this.scrollActive && !this.isMobile) {
      const trackHeight: number = this.track?.nativeElement.getBoundingClientRect().height || 0;
      const screenHeight: number = this.layout?.nativeElement.getBoundingClientRect().height || 0;
      this.sliderHeight = (screenHeight / this.scrollHeight) * trackHeight;
      this.sliderPosition = (window.scrollY / this.scrollHeight) * trackHeight;
    }
  }

  // Фокус внутри слайдера
  public onSliderMouseDown(event: MouseEvent): void {
    this.sliderMousePosY = event.y - this.slider.nativeElement.getBoundingClientRect().top;
    // Включить обнаружение движения мышкой
    this.sliderMousePress = true;
  }

  // Движение мышкой
  public onMouseMove(event: MouseEvent): void {
    if (this.sliderMousePress) {
      const pageY: number = event.y - this.track.nativeElement.getBoundingClientRect().top - this.sliderMousePosY;
      const maxY: number = this.track.nativeElement.getBoundingClientRect().height;
      window.scroll(0, (pageY / maxY) * this.scrollHeight);
    }
  }

  // Фокус внутри кнопки
  public onButtonMouseDown(direction: -1 | 1, setIndicator?: boolean): void {
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
  public onMouseUp(event: MouseEvent): void {
    this.sliderMousePress = false;
    this.buttonMousePress = false;
  }
}
