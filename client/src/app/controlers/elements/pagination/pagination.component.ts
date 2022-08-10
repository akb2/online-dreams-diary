import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { ScreenService } from "@_services/screen.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-pagination",
  templateUrl: "./pagination.component.html",
  styleUrls: ["./pagination.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PaginationComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {


  @Input() title: string = "Заголовок";
  @Input() subTitle: string = "";

  @Input() pageCurrent: number = 1;
  @Input() pageLimit: number = 1;
  @Input() count: number = 0;

  @Output() changePage: EventEmitter<PaginateEvent> = new EventEmitter<PaginateEvent>();
  @Output() initPage: EventEmitter<PaginateEvent> = new EventEmitter<PaginateEvent>();

  @ViewChild("actionsPanel") private actionsPanel: ElementRef;

  pageMax: number = 0;
  pagePrev: number = 0;
  pageNext: number = 0;

  isMobile: boolean = false;
  showActionsPanel: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  // Итератор для количества страниц
  get pageIterator(): number[] {
    return Array.from({ length: this.pageMax }, (v, k) => k + 1);
  }

  // Ближайшие к текущией странице страницы
  get pageClosestCurrentIterator(): number[] {
    const type: "start" | "center" | "end" | "none" =
      this.pageMax <= 7 ? "none" :
        this.pageCurrent > 4 && this.pageCurrent < this.pageMax - 3 ? "center" :
          this.pageCurrent <= 4 ? "start" :
            this.pageCurrent >= this.pageMax - 3 ? "end" :
              "none";
    let length: number = type === "center" ? 3 : type === "none" ? 5 : 4;
    const start: number = type === "center" ? this.pageCurrent - 1 : type === "end" ? this.pageMax - 4 : 2;
    // Корректировка
    length = length === 5 && start - 1 + length === this.pageMax ? this.pageMax - 2 : length;
    // Результат
    return Array.from({ length }, (v, k) => start + k);
  }

  // Доступно ли переключение назад
  get isPrevAvail(): boolean {
    return this.pageCurrent > 1;
  }

  // Доступно ли переключение вперед
  get isNextAvail(): boolean {
    return this.pageCurrent < this.pageMax;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService
  ) { }

  ngOnInit(): void {
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.pageLimit || !!changes.count) {
      this.calculateData(false);
      // Инициализация постраничного вывода
      this.initPage.emit({
        count: this.count,
        pageLimit: this.pageLimit,
        pageCurrent: this.pageCurrent,
        pageMax: this.pageMax
      });
    }
  }

  ngAfterViewChecked(): void {
    this.checkPanels();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Установить конкретную страницу
  onPageSet(page: number): void {
    const pageNumber: number = page as number;
    let emitEvent: boolean = false;
    // Проверить допустимость страницы
    if (pageNumber >= 1 && pageNumber <= this.pageMax) {
      emitEvent = true;
      this.pageCurrent = pageNumber;
    }
    // Пересчитать данные
    this.calculateData(emitEvent);
  }

  // Предыдущая страница
  onPagePrev(): void {
    if (this.pageCurrent > 1) {
      this.onPageSet(this.pageCurrent - 1);
    }
  }

  // Следующая страница
  onPageNext(): void {
    if (this.pageCurrent < this.pageMax) {
      this.onPageSet(this.pageCurrent + 1);
    }
  }





  // Пересчитать данные
  private calculateData(emitEvent: boolean = true): void {
    this.pageMax = Math.max(1, Math.ceil(this.count / this.pageLimit));
    // Проверить текущую страницу
    if (this.count > 0) {
      this.pageCurrent = this.pageCurrent > 0 ? (this.pageCurrent <= this.pageMax ? this.pageCurrent : this.pageMax) : 1;
    }
    // Рядом стоящие страницы
    this.pagePrev = Math.max(0, this.pageCurrent - 1);
    this.pageNext = Math.min(this.pageMax + 1, this.pageCurrent + 1);
    // Обновить
    this.changeDetectorRef.detectChanges();
    // Отправить событие
    if (emitEvent) {
      this.changePage.emit({
        count: this.count,
        pageLimit: this.pageLimit,
        pageCurrent: this.pageCurrent,
        pageMax: this.pageMax
      });
    }
  }





  // Проверить наличие панелей
  private checkPanels(): void {
    this.showActionsPanel = !!this.actionsPanel?.nativeElement?.children?.length;
    this.changeDetectorRef.detectChanges();
  }
}





// Интерфейс возвращаемых данных при смене страницы
export interface PaginateEvent {
  count: number;
  pageLimit: number;
  pageCurrent: number;
  pageMax: number;
}
