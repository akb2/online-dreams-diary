import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UserAvatarCropDataElement } from "@_models/account";
import { AppMatDialogConfig } from "@_models/app";
import { ScreenService } from "@_services/screen.service";





// Декоратор
@Component({
  selector: "app-popup-crop-image",
  templateUrl: "./crop-image.component.html",
  styleUrls: ["./crop-image.component.scss"]
})

// Класс
export class PopupCropImageComponent implements OnInit, AfterViewChecked, OnDestroy {


  @ViewChild("scaledImage") public scaledImage: ElementRef;
  @ViewChild("previewElement") public previewElement: ElementRef;

  public static popUpWidth: string = "800px";

  public imageWidth: number = 0;
  public imageHeight: number = 0;
  public sizeKoof: number = 0;

  private mouseListener: boolean;
  private mouseMoveStart: [number, number] = [0, 0];
  private moveDirection: MoveDirection[] = [];

  public position: Coords;
  public previewPosition: PreviewCoords;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupCropImageData,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef,
    private matDialogRef: MatDialogRef<PopupCropImageComponent, UserAvatarCropDataElement | null>
  ) {
    this.data.title = this.data.title ? this.data.title : "Обрезка фотографии";
    // Данные фотки
    this.screenService.loadImage(this.data.image).subscribe(
      image => {
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
  }





  // Элементы проинициализированны
  public ngOnInit(): void {
    window.addEventListener("mousemove", this.onMouseMove.bind(this), true);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), true);
  }

  // Элементы определены
  public ngAfterViewChecked(): void {
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

  // Конец класса
  public ngOnDestroy(): void {
    window.removeEventListener("mousemove", this.onMouseMove.bind(this), true);
    window.removeEventListener("mouseup", this.onMouseUp.bind(this), true);
  }

  // Начало удержания мышкой
  public onMouseDown(event: MouseEvent, direction: MoveDirection[]): void {
    this.mouseListener = true;
    this.moveDirection = direction;
    this.mouseMoveStart = [event.pageX, event.pageY];
    // Переписать значения
    this.cropSizesToCoords();
  }

  // Передвижение мышкой
  public onMouseMove(event: MouseEvent): void {
    if (this.mouseListener) {
      this.drawCrop(event.pageX, event.pageY);
      // Отрисовка позиций
      this.drawPreview();
    }
  }

  // Конец удержания мышкой
  public onMouseUp(event: MouseEvent): void {
    this.mouseListener = false;
    // Переписать значения
    this.cropCoordsToSizes();
  }

  // Закрытие окна
  public onSaveCrop(): void {
    this.matDialogRef.close(this.data.coords);
  }





  // Отрисовка области выделения
  private drawCrop(pageX: number, pageY: number) {
    const moveX: number = (pageX - this.mouseMoveStart[0]) / this.sizeKoof;
    const moveY: number = (pageY - this.mouseMoveStart[1]) / this.sizeKoof;
    // Перемещение всего блока
    if (this.moveDirection.includes("move")) {
      let width: number = this.position.x2 - this.position.x1;
      let height: number = this.position.y2 - this.position.y1;
      width = width > this.imageWidth ? this.imageWidth : width;
      height = height > this.imageHeight ? this.imageHeight : height;
      // Левый край
      this.position.x1 = this.data.coords.startX + moveX;
      this.position.x1 = this.position.x1 < 0 ? 0 : this.position.x1;
      this.position.x1 = this.position.x1 + width > this.imageWidth ? this.imageWidth - width : this.position.x1;
      // Правый край
      this.position.x2 = this.data.coords.startX + this.data.coords.width + moveX;
      this.position.x2 = this.position.x2 > this.imageWidth ? this.imageWidth : this.position.x2;
      this.position.x2 = this.position.x2 < width ? width : this.position.x2;
      // Верхний край
      this.position.y1 = this.data.coords.startY + moveY;
      this.position.y1 = this.position.y1 < 0 ? 0 : this.position.y1;
      this.position.y1 = this.position.y1 + height > this.imageHeight ? this.imageHeight - height : this.position.y1;
      // Нижний край
      this.position.y2 = this.data.coords.startY + this.data.coords.height + moveY;
      this.position.y2 = this.position.y2 > this.imageHeight ? this.imageHeight : this.position.y2;
      this.position.y2 = this.position.y2 < height ? height : this.position.y2;
    }
    // Перемещение сторон
    else {
      // Передвижение влево
      if (this.moveDirection.includes("left")) {
        this.position.x1 = this.data.coords.startX + moveX;
        this.position.x1 = this.position.x1 < 0 ? 0 : this.position.x1;
        this.position.x1 = this.position.x1 > this.position.x2 - this.data.minimal[0] ? this.position.x2 - this.data.minimal[0] : this.position.x1;
        // Корректировка правого края
        this.position.x2 = this.position.x2 > this.imageWidth ? this.imageWidth : this.position.x2;
      }
      // Передвижение вправо
      else if (this.moveDirection.includes("right")) {
        this.position.x2 = this.data.coords.startX + this.data.coords.width + moveX;
        this.position.x2 = this.position.x2 > this.imageWidth ? this.imageWidth : this.position.x2;
        this.position.x2 = this.position.x2 < this.position.x1 + this.data.minimal[0] ? this.position.x1 + this.data.minimal[0] : this.position.x2;
      }
      // Передвижение вверх
      if (this.moveDirection.includes("top")) {
        this.position.y1 = this.data.coords.startY + moveY;
        this.position.y1 = this.position.y1 < 0 ? 0 : this.position.y1;
        this.position.y1 = this.position.y1 > this.position.y2 - this.data.minimal[1] ? this.position.y2 - this.data.minimal[1] : this.position.y1;
        // Корректировка нижнего края
        this.position.y2 = this.position.y2 > this.imageHeight ? this.imageHeight : this.position.y2;
      }
      // Передвижение вниз
      else if (this.moveDirection.includes("bottom")) {
        this.position.y2 = this.data.coords.startY + this.data.coords.height + moveY;
        this.position.y2 = this.position.y2 > this.imageHeight ? this.imageHeight : this.position.y2;
        this.position.y2 = this.position.y2 < this.position.y1 + this.data.minimal[1] ? this.position.y1 + this.data.minimal[1] : this.position.y2;
      }
      // Корректировка для строгозаданного значения
      if (this.data.aspectRatio) {
        let width: number = this.position.x2 - this.position.x1;
        let height: number = this.position.y2 - this.position.y1;
        width = width > this.imageWidth ? this.imageWidth : width;
        height = height > this.imageHeight ? this.imageHeight : height;
        // Передвижение по горизонтали
        if (this.moveDirection.includes("left") || this.moveDirection.includes("right")) {
          this.position.y2 = this.position.y1 + ((width / this.data.aspectRatio[0]) * this.data.aspectRatio[1]);
          // Корректировка по минимальным размерам
          if (Math.abs(this.position.y2 - this.position.y1) < this.data.minimal[1]) {
            this.position.y2 = this.position.y1 + this.data.minimal[1];
          }
          // Корректировка перепендикулярной оси
          if (this.position.y2 > this.imageHeight) {
            this.position.y1 = this.position.y1 - this.position.y2 + this.imageHeight;
            this.position.y1 = this.position.y1 < 0 ? 0 : this.position.y1;
            this.position.y2 = this.imageHeight;
          }
          height = Math.abs(this.position.y2 - this.position.y1);
          width = (height / this.data.aspectRatio[1]) * this.data.aspectRatio[0];
          // Корректировка левой стороны
          if (this.moveDirection.includes("left")) {
            this.position.x1 = Math.abs(this.position.x1 - this.position.x2) != width ? this.position.x2 - width : this.position.x1;
          }
          // Корректировка правой стороны
          else {
            this.position.x2 = Math.abs(this.position.x1 - this.position.x2) != width ? this.position.x1 + width : this.position.x2;
          }
        }
        // Передвижение по вертикали
        if (this.moveDirection.includes("top") || this.moveDirection.includes("bottom")) {
          this.position.x2 = this.position.x1 + ((height / this.data.aspectRatio[1]) * this.data.aspectRatio[0]);
          // Корректировка по минимальным размерам
          if (Math.abs(this.position.x2 - this.position.x1) < this.data.minimal[0]) {
            this.position.x2 = this.position.x1 + this.data.minimal[0];
          }
          // Корректировка перепендикулярной оси
          if (this.position.x2 > this.imageWidth) {
            this.position.x1 = this.position.x1 - this.position.x2 + this.imageWidth;
            this.position.x1 = this.position.x1 < 0 ? 0 : this.position.x1;
            this.position.x2 = this.imageWidth;
          }
          width = this.position.x2 - this.position.x1;
          height = (width / this.data.aspectRatio[0]) * this.data.aspectRatio[1];
          // Корректировка верхней стороны
          if (this.moveDirection.includes("top")) {
            this.position.y1 = Math.abs(this.position.y1 - this.position.y2) != height ? this.position.y2 - height : this.position.y1;
          }
          // Корректировка нижней стороны
          else {
            this.position.y2 = Math.abs(this.position.y1 - this.position.y2) != height ? this.position.y1 + height : this.position.y2;
          }
        }
      }
    }
  }

  // Преобразовать входящие данные в локальные
  private cropSizesToCoords(): void {
    // Определить координаты
    const x1: number = this.data.coords?.startX || 0;
    const x2: number = x1 + (this.data.coords?.width || this.imageWidth);
    const y1: number = this.data.coords?.startY || 0;
    const y2: number = y1 + (this.data.coords?.height || this.imageHeight);
    // Сохранить координаты
    this.position = { x1, x2, y1, y2 };
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
    const blockWidth: number = this.previewElement.nativeElement.getBoundingClientRect().width | 0;
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





  // Открыть текущее окно
  public static open(matDialog: MatDialog, data: PopupCropImageData): MatDialogRef<PopupCropImageComponent> {
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