import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UserAvatarCropDataElement } from "@_models/account";
import { AppMatDialogConfig } from "@_datas/app";
import { ScreenService } from "@_services/screen.service";
import { forkJoin, fromEvent, mergeMap, skipWhile, Subject, takeUntil, takeWhile, tap, timer } from "rxjs";
import { SimpleObject } from "@_models/app";
import { ScreenKeys } from "@_models/screen";
import { CheckInRange } from "@_helpers/math";





@Component({
  selector: "app-popup-crop-image",
  templateUrl: "./crop-image.component.html",
  styleUrls: ["./crop-image.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupCropImageComponent implements OnInit, AfterViewChecked, OnDestroy {


  static popUpWidth: string = "800px";

  @ViewChild("scaledImage") scaledImage: ElementRef;
  @ViewChild("previewElement") previewElement: ElementRef;

  loading: boolean = false;
  imageWidth: number = 0;
  imageHeight: number = 0;
  sizeKoof: number = 0;

  showPreview: boolean = true;
  private hidePreviewBreakpoints: ScreenKeys[] = ["xsmall"];

  private mouseListener: boolean;
  private mouseMoveStart: [number, number] = [0, 0];
  private moveDirection: MoveDirection[] = [];

  lineKeys: MoveDirection[] = ["top", "right", "bottom", "left"];
  cornerKeys: MoveDirection[][] = [
    ...this.lineKeys.map(key => ([key])),
    ["top", "left"],
    ["top", "right"],
    ["bottom", "left"],
    ["bottom", "right"]
  ];

  position: Coords;
  previewPosition: PreviewCoords;

  private destroyed$: Subject<void> = new Subject<void>()





  // Определить миниатюру
  get isMiddle(): boolean {
    const [x, y]: [number, number] = this.data?.aspectRatio ?? [0, 0];
    return x === y && (x > 0 && y > 0);
  }

  // Стили картинки
  get getPreviewPositionCss(): SimpleObject {
    return {
      top: (this.previewPosition?.top ?? 0) + 'px',
      left: (this.previewPosition?.left ?? 0) + 'px',
      width: (this.previewPosition?.width ?? 0) + 'px',
      height: (this.previewPosition?.height ?? 0) + 'px'
    };
  }

  // Проверка сенсорного экрана
  private get isTouchDevice(): boolean {
    return "ontouchstart" in window || !!navigator?.maxTouchPoints;
  }





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupCropImageData,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef,
    private matDialogRef: MatDialogRef<PopupCropImageComponent, UserAvatarCropDataElement | null>
  ) {
    this.data.title = this.data.title ? this.data.title : "Обрезка фотографии";
  }

  ngOnInit(): void {
    const moveEvent = this.isTouchDevice ? "touchmove" : "mousemove";
    const outEvent = this.isTouchDevice ? "touchend" : "mouseup";
    // События
    forkJoin([
      fromEvent(window, moveEvent).pipe(tap(e => this.onMouseMove(e as MouseEvent))),
      fromEvent(window, outEvent).pipe(tap(e => this.onMouseUp(e as MouseEvent))),
      timer(0, 50).pipe(
        takeWhile(() => !this.scaledImage, true),
        skipWhile(() => !this.scaledImage),
        mergeMap(() => this.screenService.elmResize(this.scaledImage.nativeElement)),
        tap(() => {
          this.drawCrop(0, 0);
          this.cropCoordsToSizes();
        })
      )
    ])
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
    // Данные фотки
    this.screenService.loadImage(this.data.image)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        image => {
          this.loading = false;
          this.imageWidth = image.width;
          this.imageHeight = image.height;
          // Проверка данных
          const startX: number = this.data.coords?.startX || 0;
          const startY: number = this.data.coords?.startY || 0;
          const width: number = this.data.coords?.width || this.imageWidth;
          const height: number = this.data.coords?.height || this.imageHeight;
          this.data.coords = { startX, startY, width, height };
          // Сохранить координаты
          this.cropSizesToCoords();
        }
      );
    // Брейкпоинт
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(breakpoint => {
        this.showPreview = !this.hidePreviewBreakpoints.includes(breakpoint);
        this.changeDetectorRef.detectChanges();
      });
  }

  ngAfterViewChecked(): void {
    if (this.scaledImage) {
      const width: number = this.scaledImage.nativeElement.getBoundingClientRect().width;
      const height: number = this.scaledImage.nativeElement.getBoundingClientRect().height;
      // Коэффицент уменьшения
      this.sizeKoof = (width + height) / (this.imageWidth + this.imageHeight);
      // Позиция отрисовки
      this.drawPreview();
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Начало удержания мышкой
  onMouseDown(event: MouseEvent | TouchEvent, direction: MoveDirection[]): void {
    const clientX: number = event instanceof MouseEvent ? event.clientX : event.touches.item(0).clientX;
    const clientY: number = event instanceof MouseEvent ? event.clientY : event.touches.item(0).clientY;
    // Свойства
    this.mouseListener = true;
    this.moveDirection = direction;
    this.mouseMoveStart = [clientX, clientY];
    // Переписать значения
    this.cropSizesToCoords();
  }

  // Передвижение мышкой
  onMouseMove(event: MouseEvent | TouchEvent): void {
    if (this.mouseListener) {
      const clientX: number = event instanceof MouseEvent ? event.clientX : event.touches.item(0).clientX;
      const clientY: number = event instanceof MouseEvent ? event.clientY : event.touches.item(0).clientY;
      // Свойства
      this.drawCrop(clientX, clientY);
      // Отрисовка позиций
      this.drawPreview();
    }
  }

  // Конец удержания мышкой
  onMouseUp(event: MouseEvent | TouchEvent): void {
    this.mouseListener = false;
    this.mouseMoveStart = [0, 0];
    // Переписать значения
    this.cropCoordsToSizes();
  }

  // Закрытие окна
  onSaveCrop(): void {
    this.matDialogRef.close(this.data.coords);
  }





  // Отрисовка области выделения
  private drawCrop(pageX: number, pageY: number) {
    const moveX: number = (pageX - this.mouseMoveStart[0]) / this.sizeKoof;
    const moveY: number = (pageY - this.mouseMoveStart[1]) / this.sizeKoof;
    // Перемещение всего блока
    if (this.moveDirection.includes("move")) {
      const width: number = CheckInRange(this.position.x2 - this.position.x1, this.imageWidth);
      const height: number = CheckInRange(this.position.y2 - this.position.y1, this.imageHeight);
      // Границы краев выделения
      this.position.x1 = CheckInRange(this.data.coords.startX + moveX, this.imageWidth - width);
      this.position.x2 = CheckInRange(this.data.coords.startX + this.data.coords.width + moveX, this.imageWidth, width);
      this.position.y1 = CheckInRange(this.data.coords.startY + moveY, this.imageHeight - height);
      this.position.y2 = CheckInRange(this.data.coords.startY + this.data.coords.height + moveY, this.imageHeight, height);
    }
    // Перемещение сторон
    else {
      // Передвижение влево
      if (this.moveDirection.includes("left")) {
        this.position.x1 = CheckInRange(this.data.coords.startX + moveX, this.position.x2 - this.data.minimal[0]);
        this.position.x2 = CheckInRange(this.position.x2, this.imageWidth);
      }
      // Передвижение вправо
      else if (this.moveDirection.includes("right")) {
        this.position.x2 = CheckInRange(this.data.coords.startX + this.data.coords.width + moveX, this.imageWidth, this.position.x1 + this.data.minimal[0]);
      }
      // Передвижение вверх
      if (this.moveDirection.includes("top")) {
        this.position.y1 = CheckInRange(this.data.coords.startY + moveY, this.position.y2 - this.data.minimal[1]);
        this.position.y2 = CheckInRange(this.position.y2, this.imageHeight);
      }
      // Передвижение вниз
      else if (this.moveDirection.includes("bottom")) {
        this.position.y2 = CheckInRange(this.data.coords.startY + this.data.coords.height + moveY, this.imageHeight, this.position.y1 + this.data.minimal[1]);
      }
      // Корректировка для предела соотношений сторон по вертикали
      if (!!this.data?.verticalAspectRatio || !!this.data?.horizontalAspectRatio) {
        // Корректировка в пределах соотношения сторон
        if (!!this.data?.verticalAspectRatio && !!this.data?.horizontalAspectRatio) {
          this.rangeAspectCorrect(this.data.verticalAspectRatio, this.data.horizontalAspectRatio);
        }
        // Корректировка в строгом режиме
        else {
          this.strictAspectCorrect(!!this.data?.verticalAspectRatio ? this.data.verticalAspectRatio : this.data.horizontalAspectRatio);
        }
      }
      // Корректировка для строгозаданного значения
      if (!!this.data.aspectRatio) {
        this.strictAspectCorrect(this.data.aspectRatio);
      }
    }
  }

  // Преобразовать входящие данные в локальные
  private cropSizesToCoords(): void {
    const x1: number = this.data.coords?.startX || 0;
    const x2: number = x1 + (this.data.coords?.width || this.imageWidth);
    const y1: number = this.data.coords?.startY || 0;
    const y2: number = y1 + (this.data.coords?.height || this.imageHeight);
    // Сохранить координаты
    this.position = { x1, x2, y1, y2 };
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Преобразовать локальные данные в исходящие
  private cropCoordsToSizes(): void {
    this.data.coords = {
      startX: Math.round(this.position.x1),
      startY: Math.round(this.position.y1),
      width: Math.round(this.position.x2 - this.position.x1),
      height: Math.round(this.position.y2 - this.position.y1)
    };
  }

  // Отрисовка превью
  private drawPreview(): void {
    if (!!this.previewElement) {
      const blockWidth: number = this.previewElement.nativeElement.getBoundingClientRect().width ?? 0;
      // Координация превью
      if (blockWidth > 0) {
        const koof: number = blockWidth / Math.abs(this.position.x2 - this.position.x1);
        // Итоговые размеры превью
        this.previewPosition = {
          top: -(this.position.y1 * koof),
          left: -(this.position.x1 * koof),
          width: this.imageWidth * koof,
          height: this.imageHeight * koof,
          blockHeight: Math.abs(this.position.y2 - this.position.y1) * koof
        };
      }
    }
  }

  // Корректировка в строгом соответсвии соотношении сторон
  private strictAspectCorrect([aspectX, aspectY]: [number, number]): void {
    let width: number = CheckInRange(this.position.x2 - this.position.x1, this.imageWidth);
    let height: number = CheckInRange(this.position.y2 - this.position.y1, this.imageHeight);
    // Передвижение по горизонтали
    if (this.moveDirection.includes("left") || this.moveDirection.includes("right")) {
      this.position.y2 = this.position.y1 + ((width / aspectX) * aspectY);
      // Корректировка высоты
      if (Math.abs(this.position.y2 - this.position.y1) < this.data.minimal[1]) {
        this.position.y2 = this.position.y1 + this.data.minimal[1];
      }
      // Корректировка перепендикулярной оси
      if (this.position.y2 > this.imageHeight) {
        this.position.y1 = CheckInRange(this.position.y1 - this.position.y2 + this.imageHeight, this.imageHeight - height);
        this.position.y2 = this.imageHeight;
      }
      // Обновить высоту и ширину
      height = Math.abs(this.position.y2 - this.position.y1);
      width = (height / aspectY) * aspectX;
      // Текущая ширина
      const currentWidth: number = Math.abs(this.position.x1 - this.position.x2);
      // Корректировка левой стороны
      if (this.moveDirection.includes("left") && currentWidth != width) {
        this.position.x1 = this.position.x2 - width;
      }
      // Корректировка правой стороны
      else if (this.moveDirection.includes("right") && currentWidth != width) {
        this.position.x2 = this.position.x1 + width;
      }
    }
    // Передвижение по вертикали
    if (this.moveDirection.includes("top") || this.moveDirection.includes("bottom")) {
      this.position.x2 = this.position.x1 + ((height / aspectY) * aspectX);
      // Корректировка ширины
      if (Math.abs(this.position.x2 - this.position.x1) < this.data.minimal[0]) {
        this.position.x2 = this.position.x1 + this.data.minimal[0];
      }
      // Корректировка перепендикулярной оси
      if (this.position.x2 > this.imageWidth) {
        this.position.x1 = CheckInRange(this.position.x1 - this.position.x2 + this.imageWidth, this.imageWidth - width);
        this.position.x2 = this.imageWidth;
      }
      // Обновить высоту и ширину
      width = this.position.x2 - this.position.x1;
      height = (width / aspectX) * aspectY;
      // Текущая высота
      const currentHeight: number = Math.abs(this.position.y1 - this.position.y2);
      // Корректировка верхней стороны
      if (this.moveDirection.includes("top") && currentHeight != height) {
        this.position.y1 = this.position.y2 - height;
      }
      // Корректировка нижней стороны
      else if (this.moveDirection.includes("bottom") && currentHeight != height) {
        this.position.y2 = this.position.y1 + height;
      }
    }
  }

  // Корректировка в пределах соотношения сторон
  private rangeAspectCorrect([vAspectX, vAspectY]: [number, number], [hAspectX, hAspectY]: [number, number]): void {
    let width: number = 0;
    let height: number = 0;
    let minWidth: number = 0;
    let maxWidth: number = 0;
    let minHeight: number = 0;
    let maxHeight: number = 0;
    let currentWidth: number = 0;
    let currentHeight: number = 0;
    // Функция обновления параметров
    const updateData = () => {
      width = CheckInRange(Math.abs(this.position.x2 - this.position.x1), this.imageWidth);
      height = CheckInRange(Math.abs(this.position.y2 - this.position.y1), this.imageHeight);
      minWidth = (height / vAspectY) * vAspectX;
      maxWidth = (height / hAspectY) * hAspectX;
      minHeight = (width / hAspectX) * hAspectY;
      maxHeight = (width / vAspectX) * vAspectY;
      currentWidth = Math.abs(this.position.x1 - this.position.x2);
      currentHeight = Math.abs(this.position.y1 - this.position.y2);
    };
    // Передвижение по горизонтали
    if (this.moveDirection.includes("left") || this.moveDirection.includes("right")) {
      updateData();
      // Корректировка перпендикулярной оси по максимальной ширине
      if (currentWidth > maxWidth) {
        const newHeight: number = ((width / hAspectX) * hAspectY);
        // Нижний край
        this.position.y2 = this.position.y1 + newHeight;
        // Корректировка за пределами
        if (this.position.y2 > this.imageHeight) {
          this.position.y1 = CheckInRange(this.position.y1 - this.position.y2 + this.imageHeight, this.imageHeight - newHeight);
          this.position.y2 = this.imageHeight;
        }
        // Обновить данные
        updateData();
      }
      // Корректировка сторон по максимальной ширине
      if (currentWidth > maxWidth) {
        // Корректировка левой стороны
        if (this.moveDirection.includes("left")) {
          this.position.x1 = this.position.x2 - maxWidth;
        }
        // Корректировка правой стороны
        else if (this.moveDirection.includes("right")) {
          this.position.x2 = this.position.x1 + maxWidth;
        }
      }
      // Корректировка сторон по минимальной ширине
      if (currentWidth < minWidth) {
        // Корректировка левой стороны
        if (this.moveDirection.includes("left")) {
          this.position.x1 = this.position.x2 - minWidth;
        }
        // Корректировка правой стороны
        else if (this.moveDirection.includes("right")) {
          this.position.x2 = this.position.x1 + minWidth;
        }
      }
    }
    // Передвижение по вертикали
    if (this.moveDirection.includes("top") || this.moveDirection.includes("bottom")) {
      updateData();
      // Корректировка перпендикулярной оси по максимальной ширине
      if (currentHeight > maxHeight) {
        const newWidth: number = ((height / vAspectY) * vAspectX);
        // Нижний край
        this.position.x2 = this.position.x1 + newWidth;
        // Корректировка за пределами
        if (this.position.x2 > this.imageWidth) {
          this.position.x1 = CheckInRange(this.position.x1 - this.position.x2 + this.imageWidth, this.imageWidth - newWidth);
          this.position.x2 = this.imageWidth;
        }
        // Обновить данные
        updateData();
      }
      // Корректировка сторон по максимальной высоте
      if (currentHeight > maxHeight) {
        // Корректировка верхней стороны
        if (this.moveDirection.includes("top")) {
          this.position.y1 = this.position.y2 - maxHeight;
        }
        // Корректировка нижней стороны
        else if (this.moveDirection.includes("bottom")) {
          this.position.y2 = this.position.y1 + maxHeight;
        }
      }
      // Корректировка сторон по минимальной высоте
      if (currentHeight < minHeight) {
        // Корректировка верхней стороны
        if (this.moveDirection.includes("top")) {
          this.position.y1 = this.position.y2 - minHeight;
        }
        // Корректировка нижней стороны
        else if (this.moveDirection.includes("bottom")) {
          this.position.y2 = this.position.y1 + minHeight;
        }
      }
    }
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupCropImageData): MatDialogRef<PopupCropImageComponent> {
    const matDialogConfig: MatDialogConfig = AppMatDialogConfig;
    matDialogConfig.width = PopupCropImageComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupCropImageComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupCropImageData {
  title?: string;
  subTitle?: string;
  image: string;
  coords: UserAvatarCropDataElement;
  aspectRatio?: [number, number];
  verticalAspectRatio?: [number, number];
  horizontalAspectRatio?: [number, number];
  minimal: [number, number];
}

// Тип направления передвижения
type MoveDirection = "top" | "right" | "bottom" | "left" | "move";

// Интерфейс свойств превью
interface PreviewCoords {
  left: number;
  top: number;
  width: number;
  height: number;
  blockHeight: number;
}

// Интерфейс координат выделяемой области
export interface Coords {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}
