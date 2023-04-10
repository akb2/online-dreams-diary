import { WaitObservable } from "@_datas/api";
import { CompareElementByElement } from "@_datas/app";
import { GraffityDrawData } from "@_models/comment";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ColorPickerControl } from "@iplab/ngx-color-picker";
import { fabric } from "fabric";
import { Observable, Subject, concatMap, delay, filter, fromEvent, map, merge, mergeMap, of, takeUntil, tap } from "rxjs";





@Component({
  selector: "app-paint-canvas",
  templateUrl: "paint-canvas.component.html",
  styleUrls: ["paint-canvas.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PaintCanvasComponent implements AfterViewInit, OnDestroy {


  @Input() canvasSize: number = 452;
  @Input() drawData: GraffityDrawData = null;

  @Output() changeCanvas: EventEmitter<GraffityDrawData> = new EventEmitter();

  @ViewChild("canvasElement", { static: false, read: ElementRef }) canvasElement: ElementRef;
  @ViewChild("colorPickerButton", { read: ElementRef }) colorPickerButton: ElementRef;
  @ViewChild("colorPicker", { read: ElementRef }) colorPicker: ElementRef;
  @ViewChild("canvasOverlay", { read: ElementRef }) canvasOverlay: ElementRef;

  private canvas: fabric.Canvas;
  canvasWidth: number = 0;
  canvasHeight: number = 0;

  colorPallete: string[] = ColorPallete;
  sizesKit: number[] = SizesKit;
  private backgroundColor: string = "#ffffff";

  private undedObjects: any[] = [];

  currentColor: string;
  currentContrastColor: string;
  currentSizeIndex: number;

  showColorPicker: boolean = false;
  colorPickerControl: ColorPickerControl = new ColorPickerControl().hidePresets().hideAlphaChannel();

  private destroyed$: Subject<void> = new Subject();





  // Контрастный цвет текущему
  private getGrayContrastColor(color: string): string {
    const r: number = parseInt(color.slice(1, 3), 16);
    const g: number = parseInt(color.slice(3, 5), 16);
    const b: number = parseInt(color.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // Определить, должен ли контрастный цвет быть черным или белым
    return (yiq >= 128) ? "dark" : "light";
  }

  // Статус доступности отмены
  get canUndo(): boolean {
    return !!this.canvas?.getObjects()?.length;
  }

  // Статус доступности повтора
  get canRedo(): boolean {
    return !!this.undedObjects?.length;
  }

  // Цвет из палитры
  get isPalleteCurrentColor(): boolean {
    return ColorPallete.some(color => color.toLowerCase() === this.currentColor?.toLowerCase());
  }

  // Является ли цвет текущим
  isCurrentColor(color: string): boolean {
    return color.toLowerCase() === this.currentColor?.toLowerCase();
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private domSanitizer: DomSanitizer
  ) { }

  ngAfterViewInit(): void {
    WaitObservable(() => !this.canvasOverlay?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => <HTMLElement>this.canvasOverlay.nativeElement)
      )
      .subscribe(canvasOverlay => {
        this.canvas = new fabric.Canvas(this.canvasElement.nativeElement, {
          backgroundColor: this.drawData?.background ?? this.backgroundColor,
        });
        this.canvas.isDrawingMode = true;
        // Загрузить граффити из JSON
        if (this.drawData) {
          this.canvas.loadFromJSON(this.drawData, () => this.canvas.renderAll());
        }
        // Установить настройки
        this.setColor(this.drawData?.color);
        this.setSize(this.sizesKit.findIndex(size => size === this.drawData?.size));
        // Изменение размера
        this.screenService.elmResize(canvasOverlay)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            const availSize: number = Math.min(canvasOverlay.getBoundingClientRect().width, this.canvasSize);
            const zoom: number = availSize / this.canvasSize;
            const canvasContainer: HTMLElement = <HTMLElement>this.canvas['wrapperEl'];
            // Инициализация холста
            this.canvasWidth = availSize;
            this.canvasHeight = availSize;
            this.canvas.setWidth(this.canvasSize);
            this.canvas.setHeight(this.canvasSize);
            // Установить зум
            if (!!canvasContainer) {
              canvasContainer.style.transform = "scale(" + zoom + ")";
              canvasContainer.style.transformOrigin = "0 0";
            }
            // Обновить
            this.changeDetectorRef.detectChanges();
          });
        // Обновление состояний
        fromEvent(this.canvas, "path:created")
          .pipe(takeUntil(this.destroyed$))
          .subscribe(() => {
            this.undedObjects = [];
            this.canvas.renderAll();
            this.onSave().subscribe();
            this.changeDetectorRef.detectChanges();
          });
        // Закрыть выбор цвета
        WaitObservable(() => !this.colorPickerButton?.nativeElement)
          .pipe(
            takeUntil(this.destroyed$),
            mergeMap(() => merge(fromEvent<MouseEvent>(document, "mousedown"), fromEvent<TouchEvent>(document, "touchstart"))),
            filter(event => !CompareElementByElement(event?.target, this.colorPickerButton?.nativeElement))
          )
          .subscribe(() => {
            this.showColorPicker = false;
            this.changeDetectorRef.detectChanges();
          });
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Сохранить данные
  onSave(): Observable<GraffityDrawData> {
    return of(this.canvas.toJSON()).pipe(
      takeUntil(this.destroyed$),
      concatMap(
        () => new Observable<Blob>(observer => this.canvas.toCanvasElement().toBlob((blob: Blob) => observer.next(blob))),
        (data, blob) => ({ ...data, blob })
      ),
      concatMap(
        ({ blob }) => this.screenService.loadImage(blob),
        (data, image) => ({ ...data, image: this.domSanitizer.bypassSecurityTrustUrl(image.url) })
      ),
      map(data => ({
        ...data,
        color: this.currentColor,
        size: this.sizesKit[this.currentSizeIndex]
      })),
      tap(data => this.changeCanvas.emit(data))
    );
  }

  // Переключения показа цветовой палитры
  onColorPickerToggle(event: MouseEvent): void {
    if (!this.colorPicker?.nativeElement || !CompareElementByElement(event?.target, this.colorPicker?.nativeElement)) {
      this.showColorPicker = !this.showColorPicker;
      this.changeDetectorRef.detectChanges();
    }
  }





  // Установить цвет
  setColor(color?: string): void {
    this.currentColor = (color ?? this.colorPallete[0]).replace(/^\#/i, "");
    this.currentColor = (/^[0-9a-f]{3,6}$/i.test(this.currentColor) ? "#" : "") + this.currentColor;
    this.currentContrastColor = this.getGrayContrastColor(this.currentColor);
    this.canvas.freeDrawingBrush.color = this.currentColor;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Установить размер
  setSize(index?: number): void {
    this.currentSizeIndex = !!this.sizesKit[index] ? index : 0;
    this.canvas.freeDrawingBrush.width = this.sizesKit[this.currentSizeIndex];
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Отменить
  undo(): void {
    if (this.canUndo) {
      const lastObjectIndex: number = this.canvas.getObjects().length - 1;
      const lastObject: any = this.canvas.item(lastObjectIndex);
      // Отменить
      if (lastObject.get("type") === "path") {
        this.undedObjects.push(lastObject);
        this.canvas.remove(lastObject);
        this.canvas.renderAll();
        this.onSave().subscribe();
      }
    }
  }

  // Повторить
  redo(): void {
    if (this.canRedo) {
      const lastIndex: number = this.undedObjects.length - 1;
      const lastObject: any = this.undedObjects[lastIndex];
      // Добавить объект
      this.canvas.add(lastObject);
      this.canvas.renderAll();
      this.undedObjects.splice(lastIndex, 1);
      this.onSave().subscribe();
    }
  }

  // Очистить поле
  clear(): void {
    this.undedObjects = [];
    this.canvas.clear();
    this.canvas.backgroundColor = this.backgroundColor
    this.onSave().subscribe();
    this.changeDetectorRef.detectChanges();
  }
}





// Массив популярных цветов
const ColorPallete: string[] = [
  "#000000", // ? Черный
  "#ffffff", // ? Белый
  "#f31208", // ? Красный
  "#FFA500", // ? Оранжевый
  "#FFD700", // ? Желтый
  "#32CD32", // ? Ярко-зеленый
  "#9932CC", // ? Фиолетовый
  "#1E90FF", // ? Голубой
  "#FF7F50", // ? Коралловый
];

// Массив размеров
const SizesKit: number[] = [3, 5, 8, 13, 21, 34, 55, 89];
