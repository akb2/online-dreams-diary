import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from "@angular/core";
import { DreamMap, DreamMapCeil, SkyBoxLightTarget } from "@_models/dream";
import { SkyBoxResult, SkyBoxService } from "@_services/skybox.service";
import { ClosestHeights, TerrainService } from "@_services/terrain.service";
import { timer } from "rxjs";
import { takeWhile } from "rxjs/operators";
import { CameraHelper, Clock, Light, Mesh, PCFSoftShadowMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map.component.html",
  styleUrls: ["./dream-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;
  private ceilSize: number = 1;
  private ceilHeightParts: number = 8;
  private minCeilHeight: number = 1;
  private maxCeilHeight: number = this.ceilHeightParts * 6;
  private delta: number = 0;

  private rotateSpeed: number = 1.4;
  private moveSpeed: number = this.ceilSize * 14;
  private zoomSpeed: number = 0.8;
  private zoomMin: number = this.ceilSize;
  private zoomMax: number = this.ceilSize * 10;
  private minAngle: number = 0;
  private maxAngle: number = 80;
  private distance: number = 50;
  private fpsLimit: number = 60;
  private showHelpers: boolean = false;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private clock: Clock;
  stats: Stats;

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;





  constructor(
    private skyBoxService: SkyBoxService,
    private terrainService: TerrainService
  ) { }

  ngAfterViewInit() {
    // Создание сцены
    timer(0, 100).pipe(takeWhile(() => !this.canvas && !(!this.debugInfo || this.statsBlock), true)).subscribe(() => {
      if (this.canvas && (!this.debugInfo || this.statsBlock)) {
        this.createCanvas();
        this.createScene();
        this.createObject();
        // Рендер
        this.animate();
        // События
        this.control.addEventListener("change", (event) => this.onCameraChange(event.target));
        this.control.update();
      }
    });
  }

  ngOnDestroy() {
    this.control.removeEventListener("change", (event) => this.onCameraChange(event.target));
  }





  // Изменение позиции камеры
  onCameraChange(event: OrbitControls): void {
    this.control.panSpeed = this.moveSpeed / event.getDistance();
    // Настройка позиции камеры
    let x: number = event.target.x;
    let z: number = event.target.z;
    const mapX: number = this.dreamMap.size.width / 2 * this.ceilSize;
    const mapZ: number = this.dreamMap.size.height / 2 * this.ceilSize;
    // Ограничить положение камеры
    if (x > mapX || x < -mapX || z > mapZ || z < -mapZ) {
      x = x > mapX ? mapX : x < -mapX ? -mapX : x;
      z = z > mapZ ? mapZ : z < -mapZ ? -mapZ : z;
      // Установить позицию
      event.target = new Vector3(x, event.target.y, z);
    }
  }





  // Инициализация блока рендера
  private createCanvas(): void {
    this.width = this.canvas.nativeElement.getBoundingClientRect().width || 0;
    this.height = this.canvas.nativeElement.getBoundingClientRect().height || 0;
  }

  // Создание сцены
  private createScene(): void {
    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.sceneColor, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    // Сцена
    this.scene = new Scene();
    // Камера
    this.camera = new PerspectiveCamera(
      45, this.width / this.height,
      this.ceilSize / 10,
      this.ceilSize * this.distance
    );
    this.camera.position.z = this.ceilSize * (this.zoomMin + this.zoomMax) / 2;
    this.scene.add(this.camera);
    // Управление
    this.control = new OrbitControls(this.camera, this.canvas.nativeElement);
    this.control.screenSpacePanning = false;
    this.control.rotateSpeed = this.rotateSpeed;
    this.control.panSpeed = this.moveSpeed;
    this.control.zoomSpeed = this.zoomSpeed;
    this.control.minDistance = this.zoomMin;
    this.control.maxDistance = this.zoomMax;
    this.control.minPolarAngle = this.getAngle(this.minAngle);
    this.control.maxPolarAngle = this.getAngle(this.maxAngle);
    // Статистика
    this.stats = Stats();
    this.statsBlock.nativeElement.appendChild(this.stats.dom);
    // Таймер
    this.clock = new Clock();
  }

  // Объект
  private createObject(): void {
    if (this.scene) {
      // Скайбокс
      const skyBox: SkyBoxResult = this.skyBoxService.getObject(this.dreamMap.skyBox, this.distance, this.ceilSize);
      // Освещения
      const lightScene: Light[] = skyBox.light.filter(({ target }) => target === SkyBoxLightTarget.Scene).map(({ light }) => light);
      const lightCamera: Light[] = skyBox.light.filter(({ target }) => target === SkyBoxLightTarget.Camera).map(({ light }) => light);
      const helperScene: CameraHelper[] = this.showHelpers ?
        skyBox.light.filter(({ target, helper }) => target === SkyBoxLightTarget.Scene && helper).map(({ helper }) => helper) :
        [];
      const helperCamera: CameraHelper[] = this.showHelpers ?
        skyBox.light.filter(({ target, helper }) => target === SkyBoxLightTarget.Camera && helper).map(({ helper }) => helper) :
        [];
      // Цикл по объектам
      for (let y = -1; y < this.dreamMap.size.height + 1; y++) {
        for (let x = -1; x < this.dreamMap.size.width + 1; x++) {
          const heightPart: number = this.ceilSize / this.ceilHeightParts;
          const ceil: DreamMapCeil = this.dreamMap.ceils.some(c => c.coord.y === y && c.coord.x === x) ?
            this.dreamMap.ceils.find(c => c.coord.y === y && c.coord.x === x) :
            DefaultCeil;
          // Обработка
          ceil.coord.z = ceil.coord.z > this.maxCeilHeight ? this.maxCeilHeight : (ceil.coord.z < this.minCeilHeight ? this.minCeilHeight : ceil.coord.z);
          // Соседние блоки
          const closestCeilsCoords: { [key in keyof ClosestHeights]: { x: -1 | 0 | 1, y: -1 | 0 | 1 } } = {
            top: { x: 0, y: -1 },
            left: { x: -1, y: 0 },
            bottom: { x: 0, y: 1 },
            right: { x: 1, y: 0 },
            topLeft: { x: -1, y: -1 },
            topRight: { x: 1, y: -1 },
            bottomLeft: { x: -1, y: 1 },
            bottomRight: { x: 1, y: 1 },
          };
          // Местность
          const terrain: Mesh = this.terrainService.getObject(
            ceil.terrain,
            this.ceilSize,
            heightPart * ceil.coord.z,
            Object.entries(closestCeilsCoords)
              .map(([k, { x: cX, y: cY }]) => {
                let z: number =
                  this.dreamMap.ceils.some(c => c.coord.y === y + cY && c.coord.x === x + cX) ?
                    this.dreamMap.ceils.find(c => c.coord.y === y + cY && c.coord.x === x + cX).coord.z :
                    DefaultCeil.coord.z;
                z = z > this.maxCeilHeight ? this.maxCeilHeight : (z < this.minCeilHeight ? this.minCeilHeight : z);
                // Результат
                return [k.toString(), z * heightPart];
              })
              .reduce((o, [k, z]) => ({ ...o, [k as keyof ClosestHeights]: z as number || null }), {} as ClosestHeights)
          );
          // Настройки объекта
          terrain.position.set(
            (x - (this.dreamMap.size.width / 2)) * this.ceilSize,
            -heightPart * this.maxCeilHeight,
            (y - (this.dreamMap.size.height / 2)) * this.ceilSize
          );
          // Добавить объект на карту
          this.scene.add(terrain);
        }
      }
      // Настройки
      this.scene.background = skyBox.skyBox;
      this.scene.fog = skyBox.fog;
      // Добавить к сцене
      if (lightScene?.length > 0 || helperScene?.length > 0) {
        this.scene.add(...lightScene, ...helperScene);
      }
      // Добавить к камере
      if (lightCamera?.length > 0) {
        this.camera.add(...lightCamera, ...helperCamera);
      }
      // Рендер
      this.render();
    }
  }

  // Рендер сцены
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Обновление сцены
  private animate(): void {
    const interval: number = 1 / this.fpsLimit;
    this.delta += this.clock.getDelta();
    // Следующая отрисовка
    window.requestAnimationFrame(this.animate.bind(this));
    // Ограничение FPS
    if (this.delta > interval) {
      this.control.update();
      this.render();
      this.stats.update();
      // Обновить дельту
      this.delta = this.delta % interval;
    }
  }
}





// Пустая ячейка
const DefaultCeil: DreamMapCeil = {
  place: null,
  terrain: null,
  object: null,
  coord: { x: 0, y: 0, z: 10 }
};