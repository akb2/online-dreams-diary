import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { AngleToRad } from "@_models/app";
import { DreamMap, DreamMapCeil, SkyBoxLightTarget, WaterType } from "@_models/dream-map";
import { SkyBoxResult, SkyBoxService } from "@_services/dream-map/skybox.service";
import { ClosestHeights, TerrainService } from "@_services/dream-map/terrain.service";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamMinHeight, DreamSkyBox, DreamTerrain, DreamWaterDefHeight } from "@_services/dream.service";
import { forkJoin, fromEvent, of, Subject, throwError, timer } from "rxjs";
import { skipWhile, switchMap, takeUntil, takeWhile, tap } from "rxjs/operators";
import { CameraHelper, Clock, Intersection, Light, Mesh, MOUSE, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, Raycaster, RepeatWrapping, Scene, TextureLoader, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { Water } from "three/examples/jsm/objects/Water";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map-viewer.component.html",
  styleUrls: ["./dream-map-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TerrainService,
    SkyBoxService
  ]
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
  minCeilHeight: number = DreamMinHeight;
  maxCeilHeight: number = DreamMaxHeight;
  evenlyMaxDiff: number = Math.round(DreamCeilParts * 1.5);
  private contextType: string = "webgl";
  private waitContext: number = 30;
  private mouseMoveLimit: number = 5;

  private rotateSpeed: number = 1.4;
  private moveSpeed: number = DreamCeilSize * 14;
  private zoomSpeed: number = 1.5;
  private zoomMin: number = DreamCeilSize;
  private zoomMax: number = DreamCeilSize * 20;
  private minAngle: number = 0;
  private maxAngle: number = 80;
  private distance: number = DreamMapSize;
  private showHelpers: boolean = false;
  private drawShadows: boolean = true;
  private oceanFlowSpeed: number = 3;

  private lastMouseMove: number = 0;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private clock: Clock;
  private terrainMesh: Mesh;
  private ocean: Water;
  stats: Stats;

  private getAngle: (angle: number) => number = (angle: number) => angle * Math.PI / 180;

  loading: boolean = false;
  ready: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    if (this.isBorder(x, y)) {
      return this.getBorderCeil(x, y);
    }
    // Обычная ячейка
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) || this.getDefaultCeil(x, y);
  }

  // Ячейка по умолчанию
  getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: {
        x,
        y,
        z: DreamDefHeight,
        originalZ: DreamDefHeight
      }
    };
  }

  // Приграничная яейка
  private getBorderCeil(x: number, y: number): DreamMapCeil {
    const ceil: DreamMapCeil = this.getDefaultCeil(x, y);
    // Данные ячейки
    return {
      ...ceil,
      terrain: this.dreamMap.land.type,
      coord: {
        ...ceil.coord,
        z: this.dreamMap.land.z
      }
    };
  }

  // Объект по событию
  private getEventObject(event: MouseEvent): Intersection<Mesh> | null {
    if (event.target === this.canvas.nativeElement) {
      const raycaster: Raycaster = new Raycaster();
      const x: number = ((event.clientX - this.canvas.nativeElement.getBoundingClientRect().left) / this.width) * 2 - 1;
      const y: number = -(((event.clientY - this.canvas.nativeElement.getBoundingClientRect().top) / this.height) * 2 - 1);
      // Настройки
      raycaster.setFromCamera({ x, y }, this.camera)
      // Объекты в фокусе
      const intersect: Intersection<Mesh> = (raycaster.intersectObject(this.terrainMesh))[0] as Intersection<Mesh>;
      // Обработка объектов
      return intersect ?? null;
    }
    // Объект не найден
    return null;
  }

  // Данные карты
  get getMap(): DreamMap {
    const ceils: DreamMapCeil[] = this.dreamMap.ceils.filter(c =>
      (!!c.terrain && c.terrain > 0 && c.terrain !== DreamTerrain) ||
      (!!c.coord.originalZ && c.coord.originalZ > 0 && c.coord.originalZ !== DreamDefHeight)
    );
    // Вернуть карту
    return {
      ceils,
      camera: {},
      dreamerWay: [],
      size: this.dreamMap.size,
      skyBox: this.dreamMap.skyBox,
      ocean: {
        type: this.dreamMap?.ocean?.type ?? WaterType.pool,
        material: this.dreamMap?.ocean?.material ?? 1,
        z: this.dreamMap?.ocean?.z ?? DreamWaterDefHeight
      },
      land: {
        type: this.dreamMap?.land?.type ?? DreamTerrain,
        z: this.dreamMap?.land?.z ?? DreamDefHeight
      }
    };
  }

  // Соседние ячейки
  getClosestHeights(ceil: DreamMapCeil): ClosestHeights {
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    // Вернуть массив
    return Object.entries(ClosestCeilsCoords)
      .map(([k, { x: cX, y: cY }]) => {
        const c: DreamMapCeil = this.getCeil(ceil.coord.x + cX, ceil.coord.y + cY);
        c.coord.z = c.coord.z > this.maxCeilHeight ?
          this.maxCeilHeight :
          (c.coord.z < this.minCeilHeight ? this.minCeilHeight : c.coord.z);
        // Результат
        return [k.toString(), c.coord.z * heightPart, c.terrain];
      })
      .reduce((o, [k, height, terrain]) => ({ ...o, [k as keyof ClosestHeights]: { height, terrain } }), {} as ClosestHeights);
  }

  // Приграничная ячейка
  private isBorder(x: number, y: number): boolean {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private skyBoxService: SkyBoxService,
    private terrainService: TerrainService
  ) { }

  ngOnInit() {
    this.distance = Math.min(this.dreamMap.size.width ?? DreamMapSize, this.dreamMap.size.height ?? DreamMapSize);
    // События
    forkJoin([
      fromEvent(window, "resize", () => this.onWindowResize()),
      fromEvent(document, "mousemove", this.onMouseMove.bind(this)),
      fromEvent(document, "mousedown", this.onMouseClick.bind(this))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngAfterViewInit() {
    if (!!window.WebGLRenderingContext) {
      const testWhile: () => boolean = () => {
        return (
          !this.canvas ||
          !this.canvas?.nativeElement?.getContext(this.contextType) ||
          !(!this.debugInfo || !!this.statsBlock) ||
          !(this.width && this.height)
        );
      };
      // Начало загрузки
      this.loading = true;
      this.ready = false;
      this.changeDetectorRef.detectChanges();
      // Создание сцены
      timer(0, 100)
        .pipe(
          switchMap(i => i < this.waitContext ? of(i) : throwError(false)),
          tap(() => this.canvas ? this.createCanvas() : null),
          skipWhile(testWhile),
          takeWhile(testWhile, true),
          takeUntil(this.destroy$),
        )
        .subscribe(
          () => {
            if (!testWhile()) {
              this.loading = false;
              this.ready = true;
              this.changeDetectorRef.detectChanges();
              // Создание сцены
              this.createScene();
              this.createSky();
              this.createTerrains();
              this.createOcean();
              // События
              this.animate();
              fromEvent(this.control, "change", (event) => this.onCameraChange(event.target))
                .pipe(takeUntil(this.destroy$))
                .subscribe();
              // Обновить
              this.control.update();
            }
          },
          () => {
            this.loading = false;
            this.ready = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
    // WebGL не поддерживается
    else {
      console.error("WebGL не поддерживается");
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // Очистить сцену
    this.clearScene();
  }





  // Изменение позиции камеры
  onCameraChange(event: OrbitControls): void {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    // Настройка позиции камеры
    this.control.panSpeed = this.moveSpeed / event.getDistance();
    let x: number = event.target.x;
    let z: number = event.target.z;
    const mapX: number = width / 2 * DreamCeilSize;
    const mapZ: number = height / 2 * DreamCeilSize;
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
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      // Рендер
      this.camera.updateProjectionMatrix();
      this.render();
    }
  }

  // Движение мышки
  private onMouseMove(event: MouseEvent): void {
    const limit: number = 1000 / this.mouseMoveLimit;
    const time: number = (new Date()).getTime();
    // Триггерить событие по интервалу
    if (time - this.lastMouseMove >= limit) {
      if (this.renderer) {
        const object: Intersection<Mesh> = this.getEventObject(event);
        // Найден объект
        if (object) {
          const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
          const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
          const x: number = Math.floor(object.point.x / DreamCeilSize) + (oWidth * DreamCeilSize / 2);
          const y: number = Math.floor(object.point.z / DreamCeilSize) + (oHeight * DreamCeilSize / 2);
          // В пределах карты
          if (x >= 0 && y > 0 && x < oWidth && y < oHeight) {
            const ceil = this.getCeil(x, y);
            // Обратный вызов
            if (ceil.coord.x >= 0 && ceil.coord.y >= 0) {
              const heightPart: number = DreamCeilSize / DreamCeilParts;
              // Обратный вызов
              this.objectHover.emit({
                ceil,
                object: object.object as unknown as Mesh,
                point: {
                  x: ceil.coord.x,
                  y: ceil.coord.y,
                  z: Math.round((object.point.y + (heightPart * this.maxCeilHeight)) / heightPart),
                  xDimen: x > ceil.coord.x ? 1 : x < ceil.coord.x ? -1 : 0,
                  yDimen: y > ceil.coord.y ? 1 : y < ceil.coord.y ? -1 : 0
                }
              });
              // Завершить функцию
              return;
            }
          }
        }
      }
      // Время последнего вызова
      this.lastMouseMove = time;
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
    this.renderer = new WebGLRenderer({
      context: this.canvas.nativeElement.getContext(this.contextType),
      canvas: this.canvas.nativeElement,
      antialias: true,
      precision: "highp",
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.sceneColor, 1);
    this.renderer.shadowMap.enabled = this.drawShadows;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    // Сцена
    this.scene = new Scene();
    // Камера
    this.camera = new PerspectiveCamera(
      45,
      this.width / this.height,
      DreamCeilSize / 10,
      DreamCeilSize * this.distance
    );
    this.camera.position.z = DreamCeilSize * (this.zoomMin + this.zoomMax) / 2;
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
        DreamCeilSize
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
  private createTerrains(): void {
    if (this.scene) {
      const terrain: Mesh = this.terrainService.getObject(this.dreamMap);
      // Добавить на сцену
      this.scene.add(terrain);
      this.terrainMesh = terrain;
      // Рендер
      this.render();
    }
  }

  // Отрисовать океан
  private createOcean(): void {
    if (this.scene) {
      const width: number = this.dreamMap?.size?.width || DreamMapSize;
      const height: number = this.dreamMap?.size?.height || DreamMapSize;
      const heightPart: number = DreamCeilSize / DreamCeilParts;
      const z: number = (heightPart * this.dreamMap.ocean.z) - (heightPart * this.maxCeilHeight) - heightPart;
      const geometry: PlaneGeometry = new PlaneGeometry(
        (DreamCeilSize * (width + 2)) * 3,
        (DreamCeilSize * (height + 2)) * 3
      );
      // Создать океан
      this.ocean = new Water(geometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new TextureLoader().load("../../assets/dream-map/water/ocean.jpg", texture => texture.wrapS = texture.wrapT = RepeatWrapping),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
      });
      // Свойства
      this.ocean.position.set(0, z, 0);
      this.ocean.rotation.x = AngleToRad(-90);
      this.ocean.material.uniforms.size.value = DreamCeilSize * 10;
      this.ocean.receiveShadow = true;
      // Добавить в сцену
      this.scene.add(this.ocean);
      this.render();
    }
  }

  // Рендер сцены
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Обновление сцены
  private animate(): void {
    if (!!this.scene) {
      const heightPart: number = DreamCeilSize / DreamCeilParts;
      // Анимация
      requestAnimationFrame(this.animate.bind(this));
      // Обновить воду
      this.ocean.material.uniforms.time.value += heightPart * (this.oceanFlowSpeed / 10);
      // Обновить сцену
      this.control.update();
      this.render();
      this.stats.update();
    }
  }

  // Удалить все объекты
  private clearScene(): void {
    if (this.scene) {
      while (this.scene.children.length > 0) {
        const node: any = this.scene.children[0];
        // Удалить встроенные объекты
        Object.values(node)
          .filter((o: any) => !!o?.dispose)
          .forEach((o: any) => o?.dispose());
        // Удалить фигуру
        this.scene.remove(node);
      }
      // Очистить сцену
      this.clock.stop();
      this.stats.end();
      this.camera.clear();
      this.scene.clear();
      this.renderer.clear();
      // Очистить переменные
      this.clock = null;
      this.stats = null;
      this.camera = null;
      this.scene = null;
      this.renderer = null;
    }
  }





  // Обновить статус свечения местности
  setTerrainHoverStatus(): void {
  }

  // Обновить высоту местности
  setTerrainHeight(ceil: DreamMapCeil, isLastCeils: boolean = false): void {
  }

  // Обновить текстуру местности
  setTerrain(ceil: DreamMapCeil, isLastCeils: boolean = false): void {
  }

  // Обновить уровень мирового океана
  setOceanHeight(oceanHeight: number): void {
    this.dreamMap.ocean.z = oceanHeight;
    // Параметры
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const z: number = (heightPart * this.dreamMap.ocean.z) - (heightPart * this.maxCeilHeight) - heightPart;
    // Свойства
    this.ocean.position.setY(z);
  }

  // Обновить уровень окружающего ландшафта
  setLandHeight(landHeight: number): void {
  }
}





// Интерфейс кастомных данных для ячеек
export interface MeshUserData {
  ceil: DreamMapCeil;
  hoverEvent: boolean;
}

// Интерфейс выходных данных наведения курсора на объект
export interface ObjectHoverEvent {
  ceil: DreamMapCeil;
  object: Mesh;
  point: {
    x: number;
    y: number;
    z: number;
    xDimen: -1 | 0 | 1;
    yDimen: -1 | 0 | 1;
  };
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
