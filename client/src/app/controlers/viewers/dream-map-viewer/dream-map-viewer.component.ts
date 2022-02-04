import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { DreamMap, DreamMapCeil, DreamMapCeilDto, DreamMapDto, SkyBoxLightTarget } from "@_models/dream-map";
import { SkyBoxResult, SkyBoxService } from "@_services/dream-map/skybox.service";
import { ClosestHeights, MapTerrains, TerrainService } from "@_services/dream-map/terrain.service";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamMinHeight, DreamSkyBox } from "@_services/dream.service";
import { forkJoin, fromEvent, Subject, timer } from "rxjs";
import { takeUntil, takeWhile, skipWhile, tap } from "rxjs/operators";
import { BufferGeometry, CameraHelper, Clock, Group, Intersection, Light, Mesh, MeshPhongMaterial, MOUSE, Object3D, PCFSoftShadowMap, PerspectiveCamera, Raycaster, Scene, WebGLRenderer } from "three";
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
  private ceilSize: number = DreamCeilSize;
  private ceilHeightParts: number = DreamCeilParts;
  minCeilHeight: number = DreamMinHeight;
  maxCeilHeight: number = DreamMaxHeight;
  private defaultCeilHeight: number = DreamDefHeight;
  evenlyMaxDiff: number = Math.round(this.ceilHeightParts * 1.5);
  private delta: number = 0;

  private successHighlight: number = 0x2f2f2f;
  private errorHighlight: number = 0xff0000;

  private rotateSpeed: number = 1.4;
  private moveSpeed: number = this.ceilSize * 14;
  private zoomSpeed: number = 1.5;
  private zoomMin: number = this.ceilSize;
  private zoomMax: number = this.ceilSize * 20;
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
  private terrainMeshes: Mesh[] = [];
  private roadGroups: Group[] = [];
  stats: Stats;

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;

  private destroy$: Subject<void> = new Subject<void>();





  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) || this.getDefaultCeil(x, y);
  }

  // Ячейка по умолчанию
  getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: MapTerrains[0].id,
      object: null,
      coord: {
        x,
        y,
        z: this.defaultCeilHeight,
        originalZ: this.defaultCeilHeight
      }
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
      const intersects: Intersection<Object3D<Event>>[] = raycaster.intersectObjects(this.terrainMeshes);
      // Обработка объектов
      if (intersects.length > 0) {
        return intersects[0];
      }
    }
    // Объект не найден
    return null;
  }

  // Данные карты
  get getMap(): DreamMapDto {
    const ceils: DreamMapCeilDto[] = this.dreamMap.ceils
      .filter(c =>
        (!!c.terrain && c.terrain > 0 && c.terrain !== MapTerrains[0].id) ||
        (!!c.coord.originalZ && c.coord.originalZ > 0 && c.coord.originalZ !== this.defaultCeilHeight)
      )
      .map(c => {
        const ceil: DreamMapCeilDto = {};
        // Тип местности
        if (!!c.terrain && c.terrain !== MapTerrains[0].id && c.terrain !== 0) {
          ceil.terrain = c.terrain
        };
        // Высота
        if (c.coord.originalZ && c.coord.originalZ !== this.defaultCeilHeight && c.coord.originalZ !== 0) {
          ceil.coord = {
            x: c.coord.x,
            y: c.coord.y,
            z: c.coord.originalZ
          };
        };
        // Вернуть ячейку
        return ceil;
      });
    // Вернуть карту
    return {
      ceils,
      dreamerWay: [],
      size: this.dreamMap.size,
      skyBox: this.dreamMap.skyBox
    };
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
    const testWhile: () => boolean = () => !this.canvas || !(!this.debugInfo || !!this.statsBlock) || !this.width || !this.height;
    // Создание сцены
    timer(0, 100)
      .pipe(
        tap(() => this.canvas ? this.createCanvas() : null),
        skipWhile(testWhile),
        takeWhile(testWhile, true),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        console.log(this.width, this.height);
        this.createScene();
        this.createSky();
        this.createObject();
        // Рендер
        this.animate();
        // События
        fromEvent(this.control, "change", (event) => this.onCameraChange(event.target)).pipe(takeUntil(this.destroy$)).subscribe();
        // Обновить
        this.control.update();
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
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    // Настройка позиции камеры
    this.control.panSpeed = this.moveSpeed / event.getDistance();
    let x: number = event.target.x;
    let z: number = event.target.z;
    const mapX: number = width / 2 * this.ceilSize;
    const mapZ: number = height / 2 * this.ceilSize;
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
    if (event.button === 1 && event.target === this.canvas.nativeElement) {
      event.preventDefault();
    }
    // Движение мышкой
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

  // Отрисовать небо
  private createSky(): void {
    if (this.scene) {
      // Скайбокс
      const skyBox: SkyBoxResult = this.skyBoxService.getObject(
        this.dreamMap?.skyBox || DreamSkyBox,
        this.distance,
        this.ceilSize
      );
      // Освещения
      const lightScene: Light[] = skyBox.light.filter(({ target }) => target === SkyBoxLightTarget.Scene).map(({ light }) => light);
      const lightCamera: Light[] = skyBox.light.filter(({ target }) => target === SkyBoxLightTarget.Camera).map(({ light }) => light);
      const helperScene: CameraHelper[] = this.showHelpers ?
        skyBox.light.filter(({ target, helper }) => target === SkyBoxLightTarget.Scene && helper).map(({ helper }) => helper) :
        [];
      const helperCamera: CameraHelper[] = this.showHelpers ?
        skyBox.light.filter(({ target, helper }) => target === SkyBoxLightTarget.Camera && helper).map(({ helper }) => helper) :
        [];
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

  // Отрисовать объекты
  private createObject(): void {
    if (this.scene) {
      const width: number = this.dreamMap?.size?.width || DreamMapSize;
      const height: number = this.dreamMap?.size?.height || DreamMapSize;
      // Цикл по объектам
      for (let y = -1; y < width + 1; y++) {
        for (let x = -1; x < height + 1; x++) {
          const heightPart: number = this.ceilSize / this.ceilHeightParts;
          const ceil: DreamMapCeil = this.getCeil(x, y);
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
                const c: DreamMapCeil = this.getCeil(x + cX, y + cY);
                c.coord.z = c.coord.z > this.maxCeilHeight ? this.maxCeilHeight : (c.coord.z < this.minCeilHeight ? this.minCeilHeight : c.coord.z);
                // Результат
                return [k.toString(), c.coord.z * heightPart, c.terrain];
              })
              .reduce((o, [k, height, terrain]) => ({ ...o, [k as keyof ClosestHeights]: { height, terrain } }), {} as ClosestHeights)
          );
          // Настройки объекта
          terrain.userData = ceil;
          terrain.position.set(
            (x - (width / 2)) * this.ceilSize,
            -heightPart * this.maxCeilHeight,
            (y - (height / 2)) * this.ceilSize
          );
          // Добавить объект на карту
          this.terrainMeshes.push(terrain);
          this.scene.add(terrain);
        }
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
    let mesh: Mesh = this.terrainMeshes.find(e => (e.userData as DreamMapCeil).coord.x === ceil.coord.x && (e.userData as DreamMapCeil).coord.y === ceil.coord.y);
    // Объект найден
    if (ceil && mesh) {
      const material: MeshPhongMaterial = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as MeshPhongMaterial;
      // Дополнить материал
      material.setValues({ emissive: ceil.highlight ? this.successHighlight : 0x000000 });
    }
  }

  // Обновить высоту местности
  setTerrainHeight(ceil: DreamMapCeil): void {
    let mesh: Mesh = ceil ?
      this.terrainMeshes.find(e => (e.userData as DreamMapCeil).coord.x === ceil.coord.x && (e.userData as DreamMapCeil).coord.y === ceil.coord.y) :
      null;
    // Объект найден
    if (ceil && mesh) {
      mesh.geometry.dispose();
      // Новая геометрия
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      const geometry: BufferGeometry = this.terrainService.getGeometry(
        this.ceilSize,
        heightPart * ceil.coord.z,
        Object.entries(ClosestCeilsCoords)
          .map(([k, { x: cX, y: cY }]) => {
            const c: DreamMapCeil = this.getCeil(ceil.coord.x + cX, ceil.coord.y + cY);
            c.coord.z = c.coord.z > this.maxCeilHeight ? this.maxCeilHeight : (c.coord.z < this.minCeilHeight ? this.minCeilHeight : c.coord.z);
            // Результат
            return [k.toString(), c.coord.z * heightPart, c.terrain];
          })
          .reduce((o, [k, height, terrain]) => ({ ...o, [k as keyof ClosestHeights]: { height, terrain } }), {} as ClosestHeights)
      );
      // Дополнить материал
      geometry.computeVertexNormals();
      mesh.geometry = geometry;
      // Обновить дороги
      // this.roadGroups.forEach(r => this.scene.remove(r));
      // this.createRoads();
    }
  }

  // Обновить текстуру местности
  setTerrain(ceil: DreamMapCeil): void {
    let mesh: Mesh = this.terrainMeshes.find(e => (e.userData as DreamMapCeil).coord.x === ceil.coord.x && (e.userData as DreamMapCeil).coord.y === ceil.coord.y);
    // Объект найден
    if (ceil && mesh) {
      const oldMaterial: MeshPhongMaterial = mesh.material as MeshPhongMaterial;
      const material: MeshPhongMaterial = this.terrainService.getMaterial(ceil.terrain);
      // Дополнить материал
      mesh.material = material;
      material.setValues({ emissive: ceil.highlight ? this.successHighlight : 0x000000 });
      // Очистить старую геометрию
      oldMaterial.dispose();
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