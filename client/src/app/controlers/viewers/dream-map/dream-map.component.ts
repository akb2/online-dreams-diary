import { sanitizeIdentifier } from "@angular/compiler";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { SimpleObject } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream";
import { of, timer } from "rxjs";
import { takeWhile, tap } from "rxjs/operators";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map.component.html",
  styleUrls: ["./dream-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;
  @Input() zoom: number = 2;
  @Input() rotateX: number = 70;
  @Input() rotateZ: number = 0;

  @ViewChild("map") map: ElementRef;

  private viewerWidth: number = 0;
  private viewerHeight: number = 0;

  private positionX: number;
  private positionY: number;
  private moveX: number = 0;
  private moveY: number = 0;
  private moveZ: number = 0;
  private translateX: number = 0;
  private translateY: number = 0;
  private translateZ: number = 0;

  private zoomStep: number = 0.05;
  private zoomMin: number = 1;
  private zoomMax: number = 6;

  private size: number = 30;
  private zSize: number = 4;
  private visibleCeil: number = 4;

  private rotateMap: boolean = false;
  private rotateStartX: number = 0;
  private rotateStartY: number = 0;
  private rotateAngleStepX: number = 3;
  private rotateAngleStepZ: number = 3;
  private minRotateX: number = 0;
  private maxRotateX: number = 70;

  private moveMap: boolean = false;
  private moveStartX: number = 0;
  private moveStartY: number = 0;
  private moveStepX: number = 1;
  private moveStepY: number = 1;

  get iX(): number[] {
    return Array.apply(null, { length: this.dreamMap?.size?.width || 0 }).map(Number.call, Number);
  }

  get iY(): number[] {
    return Array.apply(null, { length: this.dreamMap?.size?.height || 0 }).map(Number.call, Number);
  }

  get ceilSize(): number {
    return this.size * this.zoom;
  }

  get ceilZSize(): number {
    return this.ceilSize / this.zSize;
  }

  get mapWidth(): number {
    return this.ceilSize * this.dreamMap.size.width;
  }

  get mapHeight(): number {
    return this.ceilSize * this.dreamMap.size.height;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    window.addEventListener("mousemove", this.onMapMove.bind(this), true);
    window.addEventListener("mouseup", this.onMapMoveEnd.bind(this), true);
  }

  ngAfterViewInit() {
    timer(0, 100).pipe(
      takeWhile(() => !this.viewerWidth || !this.viewerHeight),
      tap(() => this.defineViewer())
    ).subscribe(() => this.correctData());
  }

  ngOnDestroy() {
    window.removeEventListener("mousemove", this.onMapMove.bind(this), true);
    window.removeEventListener("mouseup", this.onMapMoveEnd.bind(this), true);
  }





  // Изменение масштаба
  onZoom(event: WheelEvent): void {
    const delta: number = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
    // Зум
    if (delta > 0 || delta < 0) {
      const oldZoom: number = this.zoom;
      // Изменить зум
      this.zoom -= this.zoomStep * delta;
      // Сбросить события
      event.preventDefault();
      // Проверка данных
      this.correctData();
      // Изменить позицию
      const viewerX: number = this.viewerWidth / 2;
      const viewerY: number = this.viewerHeight / 2;
      const mapX: number = viewerX - this.positionX;
      const mapY: number = viewerY - this.positionY;
      this.positionX = viewerX - (mapX / oldZoom * this.zoom);
      this.positionY = viewerY - (mapY / oldZoom * this.zoom);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Нажатие средней кнопки мыши
  onMapMoveStart(event: MouseEvent): void {
    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
    }

    // Повороты карты
    if (event.button === 1) {
      this.rotateStartX = event.pageX;
      this.rotateStartY = event.pageY;
      this.rotateMap = true;
      // Установить курсор
      document.body.classList.add("cursor-move");
    }
    // Перемещение
    else if (event.button === 2) {
      this.moveStartX = event.pageX;
      this.moveStartY = event.pageY;
      this.moveMap = true;
      // Установить курсор
      document.body.classList.add("cursor-all-scroll");
    }

    // Обновить
    if (event.button === 1 || event.button === 2) {
      this.changeDetectorRef.detectChanges();
    }
  }

  // Удерживание средней кнопки мыши
  private onMapMove(event: MouseEvent): void {
    // Поворот карты
    if (this.rotateMap) {
      const shiftX: number = event.pageX - this.rotateStartX;
      const shiftY: number = event.pageY - this.rotateStartY;
      // Расчет углов
      const angleZ: number = shiftX / this.rotateAngleStepZ;
      let angleX: number = shiftY / this.rotateAngleStepX;
      // Присвоение значений
      this.rotateZ -= angleZ;
      this.rotateX -= angleX;
      // Сохранить предыдущий параметр
      this.rotateStartX = event.pageX;
      this.rotateStartY = event.pageY;
      // Проверка данных
      this.correctData();
    }
    // Перемещение карты
    else if (this.moveMap) {
      const shiftX: number = event.pageX - this.moveStartX;
      const shiftY: number = event.pageY - this.moveStartY;
      // Расчет позиции
      const moveX: number = shiftX / this.moveStepX;
      const moveY: number = shiftY / this.moveStepY;
      // Присвоение значений
      this.moveX += moveX;
      this.moveY += moveY;
      // Сохранить предыдущий параметр
      this.moveStartX = event.pageX;
      this.moveStartY = event.pageY;
      // Проверка данных
      this.correctData();
    }
  }

  // Отпускание средней кнопки мыши
  onMapMoveEnd(event: MouseEvent): void {
    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
    }

    // Повороты карты
    if (event.button === 1) {
      this.rotateMap = false;
      // Установить курсор
      document.body.classList.remove("cursor-move");
    }
    // Перемещение
    else if (event.button === 2) {
      this.moveMap = false;
      // Установить курсор
      document.body.classList.remove("cursor-all-scroll");
    }

    // Обновить
    if (event.button === 1 || event.button === 2) {
      this.changeDetectorRef.detectChanges();
    }
  }





  // Данные о ячейке
  ceil(x: number, y: number): DreamMapCeil {
    // Найти ячейку
    if (this.dreamMap.ceils.some(c => c.coord.x === x && c.coord.y === y)) {
      return this.dreamMap.ceils.find(c => c.coord.x === x && c.coord.y === y);
    }
    // Ячейка не найдена
    return {
      ...DefaultCeil,
      coord: { x, y, z: 0 }
    };
  }

  // Стили карты
  layoutStyle(): SimpleObject {
    return {
      top: this.positionY + "px",
      left: this.positionX + "px",
      width: this.mapWidth + "px",
      height: this.mapHeight + "px",
      transform:
        "rotateX(" + this.rotateX + "deg) " +
        "rotateZ(" + this.rotateZ + "deg) " +
        "translate3D(" + this.translateX + "px, " + this.translateY + "px, " + this.translateZ + "px)"
    };
  }

  // Стили ячеек
  ceilStyle(ceil: DreamMapCeil): SimpleObject {
    const zIndexY: number = (ceil.coord.y + 1) * 1000;
    const zIndexX: number = ceil.coord.x < this.dreamMap.size.width / 2 ? ceil.coord.x + 1 : Math.abs(ceil.coord.x - this.dreamMap.size.width);
    // Вернуть объект
    return {
      'z-index': (zIndexX + zIndexY).toString(),
      width: (this.size * this.zoom) + "px",
      height: (this.size * this.zoom) + "px",
      top: (ceil.coord.y * this.ceilSize) + "px",
      left: (ceil.coord.x * this.ceilSize) + "px",
      perspective: ((this.ceilSize * this.visibleCeil) + (((ceil.coord.y + 1) - this.dreamMap.size.width) * this.ceilSize)) + "px"
    };
  }

  // Стили подземного слоя
  ceilUndergroundStyle(ceil: DreamMapCeil, type: WallType): SimpleObject {
    const zIndexY: number = (ceil.coord.y + 1) * 1000;
    const zIndexX: number = ceil.coord.x < this.dreamMap.size.width / 2 ? ceil.coord.x + 1 : Math.abs(ceil.coord.x - this.dreamMap.size.width);
    // Задняя стенка
    if (type === WallType.side) {
      return {
        'z-index': (100000 + zIndexX + zIndexY).toString(),
        top: (ceil.coord.y * this.ceilSize) + "px",
        left: (ceil.coord.x * this.ceilSize) + "px",
        width: this.ceilSize + "px",
        height: (this.ceilZSize * ceil.coord.z) + "px"
      };
    }
    // Прочее
    return {};
  }





  // Коррекция параметров
  private correctData(): void {
    // Проверка оси X
    this.rotateX = this.checkAngle(this.rotateX);
    this.rotateX = this.rotateX < this.minRotateX ? this.minRotateX : this.rotateX;
    this.rotateX = this.rotateX > this.maxRotateX ? this.maxRotateX : this.rotateX;
    // Проверка оси Z
    this.rotateZ = this.checkAngle(this.rotateZ);
    // Корректировки масштаба
    this.zoom = this.zoom < this.zoomMin ? this.zoomMin : this.zoom;
    this.zoom = this.zoom > this.zoomMax ? this.zoomMax : this.zoom;
    // Определение позиции карты по горизонтали
    this.positionX = this.positionX ? this.positionX : (this.viewerWidth - this.mapWidth) / 2;
    this.positionY = this.positionY ? this.positionY : (this.viewerHeight - this.mapHeight) / 2;
    // Перемещение карты
    this.translateX = (this.moveX * this.moveKoof(this.rotateZ, 0)) + (this.moveY * this.moveKoof(this.rotateZ, 90));
    this.translateY = (this.moveY * this.moveKoof(this.rotateZ, 0)) + (this.moveX * this.moveKoof(this.rotateZ, 270));
    //this.translateY = this.moveY;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Расчет параметров просмотра
  private defineViewer(): void {
    this.viewerWidth = this.map?.nativeElement?.getBoundingClientRect().width;
    this.viewerHeight = this.map?.nativeElement?.getBoundingClientRect().height;
  }

  // Расчитать сдвиг по осям
  private moveKoof(angle: number, forward: number): number {
    angle = this.checkAngle(angle);
    forward = this.checkAngle(forward);
    const backward: number = this.checkAngle(forward + 180);
    const left: number = this.checkAngle(forward - 90);
    const right: number = this.checkAngle(forward + 90);
    let min: number = 0;
    let max: number = 0;
    // 1 => 0
    if ((angle >= forward && angle < right && right > 0) || (angle >= forward && angle < 360 && right === 0)) {
      min = 1;
      max = 0;
    }
    // 0 => -1
    if ((angle >= right && angle < backward && backward > 0) || (angle >= right && angle < 360 && backward === 0)) {
      min = 0;
      max = -1;
    }
    // -1 => 0
    if ((angle >= backward && angle < left && left > 0) || (angle >= backward && angle < 360 && left === 0)) {
      min = -1;
      max = 0;
    }
    // 0 => 1
    if ((angle >= left && angle < forward && forward > 0) || (angle >= left && angle < 360 && forward === 0)) {
      min = 0;
      max = 1;
    }
    // Расчет кооэфициента
    const value: number = angle - (Math.floor(angle / 90) * 90);
    const koof: number = (max - min) / 90;
    // Вернуть результат
    return (koof * value) + min;
  }

  // Проверить угол
  private checkAngle(angle: number): number {
    angle = angle < 0 ? 360 - (Math.abs(angle) - Math.floor(Math.abs(angle) / 360) * 360) : angle;
    angle = angle > 360 ? angle - (Math.floor(angle / 360) * 360) : angle;
    angle = angle === 360 ? 0 : angle;
    // Вернуть результат
    return angle;
  }
}





// Перечисление стороны объекта
export enum WallType { side, left, right, front };

// Пустая ячейка
const DefaultCeil: DreamMapCeil = {
  place: null,
  terrain: null,
  object: null,
  coord: { x: 0, y: 0, z: 0 }
};