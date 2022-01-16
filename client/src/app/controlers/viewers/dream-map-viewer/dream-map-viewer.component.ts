import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { DreamMap, DreamMapCeil, SkyBoxLightTarget } from "@_models/dream-map";
import { SkyBoxResult, SkyBoxService } from "@_services/skybox.service";
import { ClosestHeights, MapTerrains, TerrainService } from "@_services/terrain.service";
import { forkJoin, fromEvent, Subject, timer } from "rxjs";
import { takeUntil, takeWhile } from "rxjs/operators";
import { BufferGeometry, CameraHelper, Clock, Intersection, Light, Mesh, MeshBasicMaterial, MeshPhongMaterial, MOUSE, Object3D, PCFSoftShadowMap, PerspectiveCamera, Raycaster, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map-viewer.component.html",
  styleUrls: ["./dream-map-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;

  @Output() objectHover: EventEmitter<ObjectHoverEvent> = new EventEmitter<ObjectHoverEvent>();

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("helper") private helper: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;
  private ceilSize: number = 1;
  private ceilHeightParts: number = 64;
  minCeilHeight: number = 1;
  maxCeilHeight: number = this.ceilHeightParts * 20;
  private defaultCeilHeight: number = this.ceilHeightParts * 10;
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
  private hoverMeshes: Mesh[] = [];
  stats: Stats;

  private terrainLights: MeshBasicMaterial = new MeshBasicMaterial({ color: 0xffffff });

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;

  private destroy$: Subject<void> = new Subject<void>();





  // Ячейка по умолчанию
  getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: MapTerrains[0].id,
      object: null,
      coord: { x, y, z: this.defaultCeilHeight }
    };
  }

  // Объект по событию
  private getEventObject(event: MouseEvent): Intersection<Object3D<Event>> | null {
    if (event.target === this.canvas.nativeElement) {
      const x: number = ((event.clientX - this.canvas.nativeElement.getBoundingClientRect().left) / this.width) * 2 - 1;
      const y: number = -(((event.clientY - this.canvas.nativeElement.getBoundingClientRect().top) / this.height) * 2 - 1);
      const raycaster: Raycaster = new Raycaster();
      // Настройки
      raycaster.setFromCamera({ x, y }, this.camera)
      // Объекты в фокусе
      const intersects: Intersection<Object3D<Event>>[] = raycaster.intersectObjects(this.hoverMeshes);
      // Обработка объектов
      if (intersects.length > 0) {
        return intersects[0];
      }
    }
    // Объект не найден
    return null;
  }





  constructor(
    private skyBoxService: SkyBoxService,
    private terrainService: TerrainService
  ) { }

  ngOnInit() {
    forkJoin([
      fromEvent(window, "resize", () => this.onWindowResize()),
      fromEvent(document, "mousemove", this.onMouseMove.bind(this)),
      fromEvent(document, "mousedown", this.onMouseClick.bind(this))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngAfterViewInit() {
    // Создание сцены
    timer(0, 100)
      .pipe(takeWhile(() => !this.canvas && !(!this.debugInfo || this.statsBlock), true), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.canvas && (!this.debugInfo || this.statsBlock)) {
          this.createCanvas();
          this.createScene();
          this.createObject();
          // Рендер
          this.animate();
          // События
          fromEvent(this.control, "change", (event) => this.onCameraChange(event.target)).pipe(takeUntil(this.destroy$)).subscribe();
          // Обновить
          this.control.update();
        }
      });
  }

  ngOnDestroy() {
    this.control.removeEventListener("change", (event) => this.onCameraChange(event.target));
    // Отписки
    this.destroy$.next();
    this.destroy$.complete();
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
      event.target.setX(x);
      event.target.setZ(z);
    }
  }

  // Изменение размеров экрана
  onWindowResize(): void {
    this.createCanvas();
    // Настройки
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    // Рендер
    this.camera.updateProjectionMatrix();
    this.render();
  }

  // Движение мышки
  private onMouseMove(event: MouseEvent): void {
    const object: Intersection<Object3D<Event>> = this.getEventObject(event);
    // Найден объект
    if (object) {
      const ceil: DreamMapCeil = object.object.userData as DreamMapCeil;
      // Обратный вызов
      if (ceil.coord.x >= 0 && ceil.coord.y >= 0) {
        this.objectHover.emit({ ceil, object: object.object as unknown as Mesh });
        // Завершить функцию
        return;
      }
    }
  }

  // Клик мышкой
  private onMouseClick(event: MouseEvent): void {
    this.onMouseMove(event);
  }





  // Инициализация блока рендера
  private createCanvas(): void {
    this.width = this.helper.nativeElement.getBoundingClientRect().width || 0;
    this.height = this.helper.nativeElement.getBoundingClientRect().height || 0;
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
      45,
      this.width / this.height,
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
    this.control.mouseButtons = { LEFT: null, MIDDLE: MOUSE.LEFT, RIGHT: MOUSE.RIGHT };
    // Статистика
    this.stats = Stats();
    this.statsBlock.nativeElement.appendChild(this.stats.dom);
    // Таймер
    this.clock = new Clock();
  }

  // Отрисовать объекты
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
            this.getDefaultCeil(x, y);
          // Обработка
          ceil.coord.x = x;
          ceil.coord.y = y;
          ceil.coord.z = ceil.coord.z > this.maxCeilHeight ? this.maxCeilHeight : (ceil.coord.z < this.minCeilHeight ? this.minCeilHeight : ceil.coord.z);
          // Местность
          const terrain: Mesh = this.terrainService.getObject(
            ceil.terrain,
            this.ceilSize,
            heightPart * ceil.coord.z,
            Object.entries(ClosestCeilsCoords)
              .map(([k, { x: cX, y: cY }]) => {
                let z: number =
                  this.dreamMap.ceils.some(c => c.coord.y === y + cY && c.coord.x === x + cX) ?
                    this.dreamMap.ceils.find(c => c.coord.y === y + cY && c.coord.x === x + cX).coord.z :
                    this.defaultCeilHeight;
                z = z > this.maxCeilHeight ? this.maxCeilHeight : (z < this.minCeilHeight ? this.minCeilHeight : z);
                // Результат
                return [k.toString(), z * heightPart];
              })
              .reduce((o, [k, z]) => ({ ...o, [k as keyof ClosestHeights]: z as number || null }), {} as ClosestHeights),
            (geometry: BufferGeometry, terrain: number, texture: any) => { }
          );
          // Настройки объекта
          terrain.userData = ceil;
          terrain.position.set(
            (x - (this.dreamMap.size.width / 2)) * this.ceilSize,
            -heightPart * this.maxCeilHeight,
            (y - (this.dreamMap.size.height / 2)) * this.ceilSize
          );
          // Добавить объект на карту
          this.hoverMeshes.push(terrain);
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
  render(): void {
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





  // Обновить статус свечения местности
  setTerrainHoverStatus(ceil: DreamMapCeil): void {
    let mesh: Mesh = this.hoverMeshes.find(e => (e.userData as DreamMapCeil).coord.x === ceil.coord.x && (e.userData as DreamMapCeil).coord.y === ceil.coord.y);
    // Объект найден
    if (ceil && mesh) {
      const material: MeshPhongMaterial = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as MeshPhongMaterial;
      // Дополнить материал
      material.setValues({ emissive: ceil.highlight ? 0x2f2f2f : 0x000000 });
    }
  }

  // Обновить высоту местности
  setTerrainHeight(ceil: DreamMapCeil): void {
    let mesh: Mesh = this.hoverMeshes.find(e => (e.userData as DreamMapCeil).coord.x === ceil.coord.x && (e.userData as DreamMapCeil).coord.y === ceil.coord.y);
    // Объект найден
    if (ceil && mesh) {
      mesh.geometry.dispose();
      // Новая геометрия
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      const geometry: BufferGeometry = this.terrainService.geometry(
        this.ceilSize,
        heightPart * ceil.coord.z,
        Object.entries(ClosestCeilsCoords)
          .map(([k, { x: cX, y: cY }]) => {
            let z: number =
              this.dreamMap.ceils.some(c => c.coord.y === ceil.coord.y + cY && c.coord.x === ceil.coord.x + cX) ?
                this.dreamMap.ceils.find(c => c.coord.y === ceil.coord.y + cY && c.coord.x === ceil.coord.x + cX).coord.z :
                this.defaultCeilHeight;
            z = z > this.maxCeilHeight ? this.maxCeilHeight : (z < this.minCeilHeight ? this.minCeilHeight : z);
            // Результат
            return [k.toString(), z * heightPart];
          })
          .reduce((o, [k, z]) => ({ ...o, [k as keyof ClosestHeights]: z as number || null }), {} as ClosestHeights),
      );
      // Дополнить материал
      geometry.computeVertexNormals();
      mesh.geometry = geometry;
    }
  }
}





// Интерфейс выходных данных наведения курсора на объект
export interface ObjectHoverEvent {
  ceil: DreamMapCeil;
  object: Mesh;
}

// Координаты соседних блоков
const ClosestCeilsCoords: { [key in keyof ClosestHeights]: { x: -1 | 0 | 1, y: -1 | 0 | 1 } } = {
  top: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  bottom: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
  topLeft: { x: -1, y: -1 },
  topRight: { x: 1, y: -1 },
  bottomLeft: { x: -1, y: 1 },
  bottomRight: { x: 1, y: 1 },
};