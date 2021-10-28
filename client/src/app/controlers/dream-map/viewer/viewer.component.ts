import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MapTerrains } from "@app/controlers/dream-map/terrain/terrain.component";
import { Cos, SimpleObject, Sin } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream";
import { timer } from "rxjs";
import { takeWhile, tap } from "rxjs/operators";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./viewer.component.html",
  styleUrls: ["./viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;
  @Input() zoom: number = 4;
  @Input() rotateX: number = 45;
  @Input() rotateZ: number = 0;

  @ViewChild("map") map: ElementRef;

  private viewerWidth: number = 0;
  private viewerHeight: number = 0;

  private positionX: number;
  private positionY: number;
  private translateX: number = 0;
  private translateY: number = 0;

  private zoomStep: number = 0.2;
  private zoomMin: number = 1;
  private zoomMax: number = 4.6;

  private size: number = 30;

  private rotateMap: boolean = false;
  private rotateStartX: number = 0;
  private rotateStartY: number = 0;
  private rotateAngleStepX: number = 3;
  private rotateAngleStepZ: number = 3;
  private minRotateX: number = 20;
  private maxRotateX: number = 70;

  private moveMap: boolean = false;
  private moveStartX: number = 0;
  private moveStartY: number = 0;

  iCenter: number[] = new Array(400);

  private renderDistance: number = 0;
  private renderDistanceCorrect: number = 4;
  private renderMax: number = 16;

  skipMinX: number = 0;
  skipMaxX: number = 0;
  skipMinY: number = 0;
  skipMaxY: number = 0;

  iX: number[] = [];
  iY: number[] = [];

  get ceilSize(): number {
    return this.size * this.zoom;
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
      tap(() => this.onViewerResize())
    ).subscribe();
  }

  ngOnDestroy() {
    window.addEventListener("resize", this.onViewerResize.bind(this), true);
    window.removeEventListener("mousemove", this.onMapMove.bind(this), true);
    window.removeEventListener("mouseup", this.onMapMoveEnd.bind(this), true);
  }





  // Изменение размера окна
  private onViewerResize(): void {
    if (this.map) {
      this.defineViewer();
      this.correctData(true);
    }
  }

  // Изменение масштаба
  onZoom(event: WheelEvent): void {
    const delta: number = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
    // Зум
    if (delta > 0 || delta < 0) {
      const oldZoom: number = this.zoom;
      const oldMapWidth: number = this.mapWidth;
      const oldMapHeight: number = this.mapHeight;
      // Изменить зум
      this.zoom -= this.zoomStep * delta;
      // Корректировки масштаба
      this.zoom = this.zoom < this.zoomMin ? this.zoomMin : this.zoom;
      this.zoom = this.zoom > this.zoomMax ? this.zoomMax : this.zoom;
      // Пересчитать смещение карты
      this.translateX = (this.translateX / oldMapWidth) * this.mapWidth;
      this.translateY = (this.translateY / oldMapWidth) * this.mapWidth;
      // Сбросить события
      event.preventDefault();
      // Проверка данных
      this.correctData(true);
      // Изменить позицию
      this.positionX = (this.viewerWidth / 2) - (((this.viewerWidth / 2) - this.positionX) / oldZoom * this.zoom);
      this.positionY = (this.viewerHeight / 2) - (((this.viewerHeight / 2) - this.positionY) / oldZoom * this.zoom);
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
  private onMapMove(event?: MouseEvent): void {
    const x: number = event ? event.pageX : 0;
    const y: number = event ? event.pageY : 0;
    // Поворот карты
    if (this.rotateMap) {
      const oldX: number = event ? this.rotateStartX : 0;
      const oldY: number = event ? this.rotateStartY : 0;
      // Посчитать смещение
      const shiftX: number = x - oldX;
      const shiftY: number = y - oldY;
      // Расчет углов
      const angleZ: number = shiftX / this.rotateAngleStepZ;
      const angleX: number = shiftY / this.rotateAngleStepX;
      // Присвоение значений
      this.rotateZ -= angleZ;
      this.rotateX -= angleX;
      // Сохранить предыдущий параметр
      this.rotateStartX = x;
      this.rotateStartY = y;
      // Проверка данных
      this.correctData();
    }
    // Перемещение карты
    else if (this.moveMap) {
      const oldX: number = event ? this.moveStartX : 0;
      const oldY: number = event ? this.moveStartY : 0;
      // Посчитать смещение
      const shiftX: number = x - oldX;
      const shiftY: number = y - oldY;
      // Присвоение для сдвига карты
      this.translateX += (shiftX * Cos(this.rotateZ)) + (shiftY * Sin(this.rotateZ));
      this.translateY += (shiftX * -Sin(this.rotateZ)) + (shiftY * Cos(this.rotateZ));
      this.translateX = this.translateX > (this.mapWidth / 2) ? this.mapWidth / 2 : this.translateX < (-this.mapWidth / 2) ? -this.mapWidth / 2 : this.translateX;
      this.translateY = this.translateY > (this.mapHeight / 2) ? this.mapHeight / 2 : this.translateY < (-this.mapHeight / 2) ? -this.mapHeight / 2 : this.translateY;
      // Сохранить предыдущий параметр
      this.moveStartX = x;
      this.moveStartY = y;
      // Проверка данных
      this.correctData(true);
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
      coord: { x, y, z: DefaultCeil.coord.z }
    };
  }

  // Стили карты
  layoutStyle(): SimpleObject {
    let skipMinY: number = this.skipMinY - this.renderDistanceCorrect;
    skipMinY = skipMinY < 0 ? 0 : skipMinY;
    let skipMinX: number = this.skipMinX - this.renderDistanceCorrect;
    skipMinX = skipMinX < 0 ? 0 : skipMinX;
    let skipMaxY: number = this.skipMaxY - this.renderDistanceCorrect;
    skipMaxY = skipMaxY < 0 ? 0 : skipMaxY;
    let skipMaxX: number = this.skipMaxX - this.renderDistanceCorrect;
    skipMaxX = skipMaxX < 0 ? 0 : skipMaxX;
    // Свойства
    return {
      top: this.positionY + "px",
      left: this.positionX + "px",
      width: (this.mapWidth - ((skipMaxX) * this.ceilSize)) + "px",
      height: (this.mapHeight - ((skipMaxY) * this.ceilSize)) + "px",
      "padding-top": (skipMinY * this.ceilSize) + "px",
      "padding-left": (skipMinX * this.ceilSize) + "px",
      "grid-template-columns": "repeat(" + (this.dreamMap.size.width - skipMinX - skipMaxX) + ", 1fr)",
      "grid-template-rows": "repeat(" + (this.dreamMap.size.height - skipMinY - skipMaxY) + ", 1fr)",
      "transform-origin":
        ((this.mapWidth / 2) - this.translateX) + "px " +
        ((this.mapHeight / 2) - this.translateY) + "px " +
        "0px ",
      transform:
        "translateZ(" + (-800 * Sin(this.rotateX)) + "px) " +
        "translateX(" + this.translateX + "px) " +
        "translateY(" + this.translateY + "px) " +
        "rotateX(" + this.rotateX + "deg) " +
        "rotateZ(" + this.rotateZ + "deg) " +
        ""
    };
  }

  // Рендерить ли строку
  renderY(y: number): boolean {
    return (
      y >= 0 &&
      y < this.dreamMap.size.height &&
      y >= this.skipMinY - this.renderDistanceCorrect &&
      y < this.dreamMap.size.height - this.skipMaxY + this.renderDistanceCorrect
    );
  }

  // Рендерить ли колонку
  renderX(x: number): boolean {
    return (
      x >= 0 &&
      x < this.dreamMap.size.width &&
      x >= this.skipMinX - this.renderDistanceCorrect &&
      x < this.dreamMap.size.width - this.skipMaxX + this.renderDistanceCorrect
    );
  }

  // Класс тумана
  renderFog(x: number, y: number): number {
    const fogX: number = !this.renderX(x) || (x >= this.skipMinX && x < this.dreamMap.size.width - this.skipMaxX) ? 0 :
      x < this.skipMinX ? this.skipMinX - x :
        x - this.dreamMap.size.width + this.skipMaxX + 1
      ;
    const fogY: number = !this.renderY(y) || (y >= this.skipMinY && y < this.dreamMap.size.height - this.skipMaxY) ? 0 :
      y < this.skipMinY ? this.skipMinY - y :
        y - this.dreamMap.size.width + this.skipMaxY + 1
      ;
    // Результат
    return fogX === 0 && fogY === 0 ? 0 : Math.max(Math.max(fogX, 1), Math.max(fogY, 1));
  }





  // Коррекция параметров
  private correctData(render: boolean = false): void {
    // Проверка оси X
    this.rotateX = this.rotateX < this.minRotateX ? this.minRotateX : this.rotateX;
    this.rotateX = this.rotateX > this.maxRotateX ? this.maxRotateX : this.rotateX;
    // Проверка оси Z
    this.rotateZ = this.checkAngle(this.rotateZ);
    // Определение позиции карты по горизонтали
    this.positionX = this.positionX ? this.positionX : (this.viewerWidth - this.mapWidth) / 2;
    this.positionY = this.positionY ? this.positionY : (this.viewerHeight - this.mapHeight) / 2;
    // Расчитать дальность прорисовки
    this.checkRenderDistance();
    // Пределы видимости карты
    const minX: number = Math.max(0, this.skipMinX - this.renderDistanceCorrect);
    const maxX: number = Math.min(this.dreamMap.size.width, this.dreamMap.size.width - this.skipMaxX + this.renderDistanceCorrect);
    const minY: number = Math.max(0, this.skipMinY - this.renderDistanceCorrect);
    const maxY: number = Math.min(this.dreamMap.size.height, this.dreamMap.size.height - this.skipMaxY + this.renderDistanceCorrect);
    // Расчитать массивы для прорисовки
    if (render) {
      this.iX = [];
      this.iY = [];
      for (let x = minX; x < maxX; x++) { this.iX.push(x); }
      for (let y = minY; y < maxY; y++) { this.iY.push(y); }
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Определить дальность прорисовки
  private checkRenderDistance(): void {
    // Центральные координаты
    const centerX: number = (this.mapWidth / 2) - this.translateX;
    const centerY: number = (this.mapHeight / 2) - this.translateY;
    const renderDistance: number = Math.min((this.renderMax / 2) * this.ceilSize, this.renderDistance);
    // Минимальные ячейки
    let minCeilX: number = Math.floor((centerX - renderDistance) / this.ceilSize);
    let minCeilY: number = Math.floor((centerY - renderDistance) / this.ceilSize);
    minCeilX = minCeilX < 0 ? 0 : minCeilX;
    minCeilY = minCeilY < 0 ? 0 : minCeilY;
    // Максимальные ячейки
    let maxCeilX: number = Math.ceil((centerX + renderDistance) / this.ceilSize);
    let maxCeilY: number = Math.ceil((centerY + renderDistance) / this.ceilSize);
    maxCeilX = maxCeilX >= this.dreamMap.size.width ? this.dreamMap.size.width : maxCeilX;
    maxCeilY = maxCeilY >= this.dreamMap.size.height ? this.dreamMap.size.height : maxCeilY;
    // Расчитать отступы
    this.skipMinX = minCeilX;
    this.skipMaxX = this.dreamMap.size.width - maxCeilX;
    this.skipMinY = minCeilY;
    this.skipMaxY = this.dreamMap.size.height - maxCeilY;
  }

  // Расчет параметров просмотра
  private defineViewer(): void {
    this.viewerWidth = this.map?.nativeElement?.getBoundingClientRect().width;
    this.viewerHeight = this.map?.nativeElement?.getBoundingClientRect().height;
    // Дальность прорисовки
    this.renderDistance = (this.viewerWidth + this.viewerHeight) / 2;
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





// Пустая ячейка
const DefaultCeil: DreamMapCeil = {
  place: null,
  terrain: MapTerrains.find(t => t.id === 1),
  object: null,
  coord: { x: 0, y: 0, z: 8 }
};