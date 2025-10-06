import { CreateArray } from "@_datas/app";
import { ClosestHeightNames } from "@_datas/dream-map";
import { ClosestCeilsCoords, DreamMapObjectIntersectorName, DreamMapOceanName, DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCameraMaxZoom, DreamCameraMinZoom, DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamMinHeight, DreamSkyTime, DreamTerrain, DreamWaterDefHeight } from "@_datas/dream-map-settings";
import { GetDreamMapObjectByID } from "@_datas/three.js/objects/_functions";
import { GetInstanceBoundingBox } from "@_helpers/geometry";
import { AngleByLegs, AngleToRad, Cos, LineFunc, Sin } from "@_helpers/math";
import { ArrayFilter, ArrayForEach, ArraySome, MapCycle, XYForEach } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeightName, ClosestHeights, Coord, CoordDto, DreamMap, DreamMapCameraPosition, DreamMapCeil, DreamMapSettings, ReliefType, XYCoord } from "@_models/dream-map";
import { DreamMapObject, MapObject, MapObjectRaycastBoxData, ObjectSetting } from "@_models/dream-map-objects";
import { NumberDirection } from "@_models/math";
import { ShearableInstancedMesh } from "@_models/three.js/shearable-instanced-mesh";
import { DreamService } from "@_services/dream.service";
import { DreamMapObjectService } from "@_services/three.js/object.service";
import { DreamMapSkyBoxService, FogFar, SkyBoxOutput } from "@_services/three.js/skybox.service";
import { DreamMapTerrainService } from "@_services/three.js/terrain.service";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { anyToFloat, anyToInt } from "@akb2/types-tools";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { Octree, OctreeRaycaster } from "@brakebein/threeoctree";
import { BlendMode, CircleOfConfusionMaterial, DepthOfFieldEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { Observable, Subject, forkJoin, fromEvent, of, throwError, timer } from "rxjs";
import { map, skipWhile, switchMap, take, takeUntil, takeWhile, tap } from "rxjs/operators";
import { BoxGeometry, CineonToneMapping, Clock, Color, CylinderGeometry, DirectionalLight, DoubleSide, FrontSide, Group, Intersection, LineBasicMaterial, MOUSE, Material, Matrix4, Mesh, MeshPhongMaterial, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, RepeatWrapping, SRGBColorSpace, Scene, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { Water } from "three/examples/jsm/objects/Water";





@Component({
  selector: "app-dream-map-viewer",
  templateUrl: "./dream-map-viewer.component.html",
  styleUrls: ["./dream-map-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DreamMapTerrainService,
    DreamMapSkyBoxService,
    DreamMapObjectService
  ]
})

export class DreamMapViewerComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {


  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = false;
  @Input() showCompass: boolean = false;
  @Input() dreamMapSettings: DreamMapSettings;

  @Output() objectHover: EventEmitter<ObjectHoverEvent> = new EventEmitter<ObjectHoverEvent>();

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("helper") private helper: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;
  evenlyMaxDiff: number = Math.round(DreamCeilParts * 1.5);
  private contextType: string = "webgl";
  private waitContext: number = 30;
  private mouseMoveLimit: number = 5;

  private rotateSpeed: number = 1.4;
  private moveSpeed: number = DreamCeilSize * 14;
  private zoomSpeed: number = DreamCeilSize;
  private minAngle: number = 0;
  private maxAngle: number = 85;
  private drawShadows: boolean = true;
  private oceanFlowSpeed: number = 3;

  private lastMouseMove: number = 0;

  chairPositionY: number = 0;
  chairPositionX: number = 0;

  private objectRaycastBoxes: ObjectRaycastMesh[] = [];
  private postProcessingEffects: PostProcessingEffects;
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private scene: Scene;
  private octree: Octree;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private clock: Clock;
  private terrainMesh: Mesh;
  private ocean: Water;
  private sun: DirectionalLight;
  private animateFunctions: CustomObjectKey<string, Function> = {};
  private cursor: CursorData = DefaultCursorData;
  private objectSettings: ObjectSetting[] = [];
  private objectCounts: CustomObjectKey<string, number> = {};
  stats: Stats;
  hoverCoords: XYCoord = null;
  compassAngle: number = 0;

  loading: boolean = false;
  ready: boolean = false;

  private destroyed$: Subject<void> = new Subject<void>();





  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    if (this.isBorder(x, y)) {
      return this.getBorderCeil(x, y);
    }
    // Обычная ячейка
    else if (!!this.dreamMap?.ceils?.filter(c => c.coord.x === x && c.coord.y === y)?.length) {
      return this.dreamMap.ceils.find(c => c.coord.x === x && c.coord.y === y);
    }
    // Новая ячейка
    const ceil: DreamMapCeil = this.getDefaultCeil(x, y);
    // Сохранить ячейку
    this.dreamMap.ceils.push(ceil);
    // Вернуть ячейку
    return ceil;
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

  // Объект по событию
  private getEventObject(event: MouseEvent | TouchEvent): Intersection[] {
    if (event.target === this.canvas.nativeElement) {
      const clientX: number = (event instanceof MouseEvent ? event.clientX : event.touches.item(0).clientX) - this.canvas.nativeElement.getBoundingClientRect().left;
      const clientY: number = (event instanceof MouseEvent ? event.clientY : event.touches.item(0).clientY) - this.canvas.nativeElement.getBoundingClientRect().top;
      const objects: Intersection[] = ArrayFilter(this.getIntercectionObject(clientX, clientY), ({ object: { name } }) => name === DreamMapTerrainName);
      const closestObjects: Intersection[] = objects?.sort(({ distance: distanceA }, { distance: distanceB }) => distanceA - distanceB);
      // Поиск объектов
      return !!closestObjects?.length ? closestObjects : null;
    }
    // Объект не найден
    return null;
  }

  // Получить объекты пересечения
  private getIntercectionObject(x: number, y: number): Intersection[] {
    x = (x / this.width) * 2 - 1;
    y = -((y / this.height) * 2 - 1);
    const far: number = FogFar * DreamCeilSize;
    const raycaster: OctreeRaycaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, far);
    // Настройки
    raycaster.setFromCamera(new Vector2(x, y), this.camera);
    // Объекты в фокусе
    const intersect: Intersection[] = raycaster.intersectOctreeObjects(this.octree.search(raycaster.ray.origin, far, true, raycaster.ray.direction));
    // Обработка объектов
    return intersect?.length ? intersect : null;
  }

  // Получить пересечения по мировым координатам
  private getIntercectionObjectByCoords(x: number, y: number): Intersection[] {
    const min: number = Math.min(0, DreamMinHeight);
    const max: number = DreamMaxHeight;
    const far: number = max - min;
    const raycaster: OctreeRaycaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, far);
    const origin: Vector3 = new Vector3(x, max + DreamCeilSize, y);
    const direction: Vector3 = new Vector3(0, -1, 0);
    // Настройки
    raycaster.set(origin, direction);
    // Объекты в фокусе
    const intersect: Intersection[] = raycaster.intersectOctreeObjects(this.octree.search(raycaster.ray.origin, far, true, raycaster.ray.direction));
    // Обработка объектов
    return intersect?.length ? intersect : null;
  }

  // Данные карты
  get getMap(): DreamMap {
    const ceils: DreamMapCeil[] = this.dreamMap.ceils.filter(c =>
      (!!c.terrain && c.terrain > 0 && c.terrain !== DreamTerrain) ||
      (!!c.coord.originalZ && c.coord.originalZ > 0 && c.coord.originalZ !== DreamDefHeight)
    );
    const defaultCamera: DreamMapCameraPosition = this.dreamService.getDefaultCamera(this.dreamMap.size.width, this.dreamMap.size.height);
    // Вернуть карту
    return {
      ceils,
      camera: {
        target: {
          x: this.control?.target?.x ?? defaultCamera.target.x,
          y: this.control?.target?.y ?? defaultCamera.target.y,
          z: this.control?.target?.z ?? defaultCamera.target.z,
        },
        position: {
          x: this.camera?.position?.x ?? defaultCamera.position.x,
          y: this.camera?.position?.y ?? defaultCamera.position.y,
          z: this.camera?.position?.z ?? defaultCamera.position.z,
        }
      },
      dreamerWay: [],
      size: this.dreamMap.size,
      ocean: {
        material: this.dreamMap?.ocean?.material ?? 1,
        z: this.dreamMap?.ocean?.z ?? DreamWaterDefHeight
      },
      land: {
        type: this.dreamMap?.land?.type ?? DreamTerrain,
        z: this.dreamMap?.land?.z ?? DreamDefHeight
      },
      sky: {
        time: this.dreamMap?.sky?.time ?? DreamSkyTime
      },
      relief: {
        types: ClosestHeightNames.reduce((o, name) => ({
          ...o,
          [name as ClosestHeightName]: this.dreamMap?.relief?.types?.hasOwnProperty(name) ? this.dreamMap.relief.types[name] : ReliefType.flat
        }), {})
      },
      isNew: false,
      noiseSeed: 0,
      noise: null
    };
  }

  // Соседние ячейки
  private getClosestCeils(ceil: DreamMapCeil): ClosestHeights {
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    // Вернуть массив
    return Object.entries(ClosestCeilsCoords)
      .map(([k, { x: cX, y: cY }]) => {
        const c: DreamMapCeil = this.getCeil(ceil.coord.x + cX, ceil.coord.y + cY);
        c.coord.z = c.coord.z > DreamMaxHeight ?
          DreamMaxHeight :
          (c.coord.z < DreamMinHeight ? DreamMinHeight : c.coord.z);
        // Результат
        return [k.toString(), c.coord.z * heightPart, c.terrain, c.object ?? 0, c.coord];
      })
      .reduce((o, [k, height, terrain, object, coords]) => ({
        ...o,
        [k as keyof ClosestHeights]: {
          height: height as number,
          terrain: terrain as number,
          object: object as number,
          coords: coords as Coord
        }
      }), {} as ClosestHeights);
  }

  // Приграничная ячейка
  private isBorder(x: number, y: number): boolean {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }

  // Проверка сенсорного экрана
  private get isTouchDevice(): boolean {
    return "ontouchstart" in window || !!navigator?.maxTouchPoints;
  }

  // Получить настройку по индексу в меше
  private getObjectSettingKeyByIndex(index: number, type: string, subType: string, key: number, keys: CustomObjectKey<string, number[]>): number {
    const keyType: string = type + (!!subType ? "-" + subType : "");
    // Поиск в текущем ключе
    if (
      !!this.objectSettings[key] &&
      this.objectSettings[key].type === type &&
      ((this.objectSettings[key].subType === subType && !!subType) || !subType) &&
      this.objectSettings[key].indexKeys.includes(index)
    ) {
      return key;
    }
    // Поиск в массиве использованных объектов
    else if (!!keys?.length) {
      const keysA: number[] = keys[keyType];
      // Вернуть ключ
      return keysA.map(k =>
        !!this.objectSettings[k] &&
          this.objectSettings[k].indexKeys.includes(index) ? k : -1
      ).filter(k => k >= 0)[0];
    }
    // Поиск среди всех настроек
    return this.objectSettings
      .map(({ type: t, subType: st, indexKeys: is }, k) => t === type && (st === subType || !subType) ? (is.includes(index) ? k : -1) : -1)
      .filter(k => k >= 0)[0];
  }

  // Получить настройку по координатам
  private getObjectSettingByCoords(x: number, y: number): number[] {
    return !!this.objectSettings ? this.objectSettings
      .map(({ coords: { x: oX, y: oY } }, k) => x === oX && y === oY ? k : -1)
      .filter(k => k >= 0) :
      [];
  }

  // Фильтр на получение данных об объекте по типу и подтипу
  private getFilterObjectsFunc(objectSettings: ObjectSetting, type: string, subType: string, splitBySubType: boolean): boolean {
    return objectSettings.type === type && (!splitBySubType || (splitBySubType && objectSettings.subType === subType));
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private skyBoxService: DreamMapSkyBoxService,
    private terrainService: DreamMapTerrainService,
    private objectService: DreamMapObjectService,
    private dreamService: DreamService
  ) { }

  ngOnChanges(): void {
    this.dreamMapSettings = this.dreamMapSettings ?? this.dreamService.getDreamMapSettings;
  }

  ngOnInit() {
    const moveEvent = this.isTouchDevice ? "touchmove" : "mousemove";
    const enterEvent = this.isTouchDevice ? "touchstart" : "mousedown";
    // Объеденить события
    forkJoin([
      fromEvent(window, "resize", () => this.onWindowResize()),
      fromEvent(document, moveEvent, this.onMouseMove.bind(this)),
      fromEvent(document, enterEvent, this.onMouseClick.bind(this)),
    ])
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }

  ngAfterViewInit() {
    if (!!window.WebGLRenderingContext) {
      const testWhile: () => boolean = () => {
        return (
          !this.canvas ||
          !this.canvas?.nativeElement?.getContext(this.contextType, { willReadFrequently: true }) ||
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
          takeUntil(this.destroyed$)
        )
        .subscribe(
          () => !testWhile() ? this.create3DViewer() : null,
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
    this.destroyed$.next();
    this.destroyed$.complete();
    // Очистить сцену
    this.clearScene();
  }





  // Изменение позиции камеры
  private onCameraChange(event: OrbitControls): void {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    const vector: Vector3 = new Vector3();
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
    // Угол для компаса
    event.object.getWorldDirection(vector);
    this.compassAngle = AngleByLegs(-vector.x, -vector.z);
    this.changeDetectorRef.detectChanges();
    // обновить пост отрисовку
    this.updatePostProcessors();
    // обновить объекты
    // this.objects.filter(object => object instanceof LOD).forEach(object => (object as LOD).update(this.camera));
  }

  // Изменение размеров экрана
  private onWindowResize(): void {
    this.createCanvas();
    // Настройки
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      // обновить пост отрисовку
      this.updatePostProcessors();
      // Рендер
      this.camera.updateProjectionMatrix();
      this.render();
    }
  }

  // Движение мышки
  private onMouseMove(event: MouseEvent | TouchEvent): void {
    const limit: number = 1000 / this.mouseMoveLimit;
    const time: number = (new Date()).getTime();
    // Триггерить событие по интервалу
    if (time - this.lastMouseMove >= limit) {
      if (this.renderer) {
        const objects: Intersection[] = this.getEventObject(event);
        this.hoverCoords = null;
        this.changeDetectorRef.detectChanges();
        // Найден объект
        if (!!objects && !!objects?.length) {
          const object: Intersection = objects[0];
          const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
          const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
          const x: number = Math.floor(object.point.x / DreamCeilSize) + (oWidth * DreamCeilSize / 2);
          const y: number = Math.floor(object.point.z / DreamCeilSize) + (oHeight * DreamCeilSize / 2);
          // В пределах карты
          if (x >= 0 && y >= 0 && x < oWidth && y < oHeight) {
            const ceil = this.getCeil(x, y);
            // Обратный вызов
            if (ceil.coord.x >= 0 && ceil.coord.y >= 0) {
              const heightPart: number = DreamCeilSize / DreamCeilParts;
              // Записать текущие координаты
              this.hoverCoords = { x, y };
              // Обратный вызов
              this.objectHover.emit({
                ceil,
                object: object.object as unknown as Mesh,
                point: {
                  x: ceil.coord.x,
                  y: ceil.coord.y,
                  z: Math.round((object.point.y + (heightPart * DreamMaxHeight)) / heightPart),
                  xDimen: x > ceil.coord.x ? 1 : x < ceil.coord.x ? -1 : 0,
                  yDimen: y > ceil.coord.y ? 1 : y < ceil.coord.y ? -1 : 0
                }
              });
              // Завершить функцию
              return;
            }
          }
        }
        // Убрать курсор
        if (!this.hoverCoords) {
          this.setTerrainHoverStatus();
        }
      }
      // Время последнего вызова
      this.lastMouseMove = time;
    }
  }

  // Клик мышкой
  private onMouseClick(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent) {
      if (event.button === 1 && event.target === this.canvas.nativeElement) {
        event.preventDefault();
      }
      // Движение мышкой
      this.onMouseMove(event);
    }
    // Сенсорный экран
    else if (event.touches.length === 1) {
      this.onMouseMove(event);
    }
  }





  // Инициализация блока рендера
  private createCanvas(): void {
    this.width = this.helper.nativeElement.getBoundingClientRect().width || 0;
    this.height = this.helper.nativeElement.getBoundingClientRect().height || 0;
  }

  // Создание 3D просмотра
  private create3DViewer(): void {
    this.createScene();
    this.createSky();
    this.createOcean();
    // Создание местности
    this.createTerrains().subscribe(() => {
      this.createObjects();
      this.createCursor();
      this.createPostProcessors();
      // События
      this.animate();
      // обновить пост отрисовку
      this.updatePostProcessors();
      // Изменение камеры
      fromEvent(this.control, "change", (event) => this.onCameraChange(event.target))
        .pipe(takeUntil(this.destroyed$))
        .subscribe();
      // Обновить
      this.loading = false;
      this.ready = true;
      this.control.update();
      this.changeDetectorRef.detectChanges();
    });
  }

  // Создание сцены
  private createScene(): void {
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const raycastSize: number = (mapWidth * mapHeight) + 3;
    const depthMax: number = 1;
    const preferredObjectsPerNode: number = 8;
    const objectsThreshold: number = anyToInt(Math.ceil(raycastSize / Math.pow(2, depthMax)), preferredObjectsPerNode);
    // Отрисовщик
    this.renderer = new WebGLRenderer({
      context: this.canvas.nativeElement.getContext(this.contextType, { willReadFrequently: true }),
      canvas: this.canvas.nativeElement,
      antialias: true,
      alpha: true,
      precision: "highp",
      powerPreference: "high-performance",
      logarithmicDepthBuffer: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.sceneColor, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = this.drawShadows;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = CineonToneMapping;
    // Сцена
    this.scene = new Scene();
    // Камера
    this.camera = new PerspectiveCamera(
      30,
      this.width / this.height,
      DreamCeilSize / 10,
      FogFar * DreamCeilSize
    );
    this.camera.position.setX(this.dreamMap.camera.position.x);
    this.camera.position.setY(this.dreamMap.camera.position.y);
    this.camera.position.setZ(this.dreamMap.camera.position.z);
    this.camera.far = FogFar * DreamCeilSize;
    this.scene.add(this.camera);
    // Пересечения
    this.octree = new Octree({
      // scene: this.scene,
      undeferred: false,
      depthMax: 1,
      objectsThreshold,
      overlapPct: 0.15
    });
    // Управление
    this.control = new OrbitControls(this.camera, this.canvas.nativeElement);
    this.control.screenSpacePanning = false;
    this.control.rotateSpeed = this.rotateSpeed;
    this.control.panSpeed = this.moveSpeed;
    this.control.zoomSpeed = this.zoomSpeed;
    this.control.minDistance = DreamCameraMinZoom;
    this.control.maxDistance = DreamCameraMaxZoom;
    this.control.minPolarAngle = AngleToRad(this.minAngle);
    this.control.maxPolarAngle = AngleToRad(this.maxAngle);
    this.control.mouseButtons = { LEFT: null, MIDDLE: MOUSE.LEFT, RIGHT: MOUSE.RIGHT };
    this.control.target.setX(this.dreamMap.camera.target.x);
    this.control.target.setY(this.dreamMap.camera.target.y);
    this.control.target.setZ(this.dreamMap.camera.target.z);
    this.onCameraChange(this.control);
    // Статистика
    this.stats = new Stats();
    this.statsBlock.nativeElement.appendChild(this.stats.dom);
    // Таймер
    this.clock = new Clock();
  }

  // Создание пост обработки
  private createPostProcessors(): void {
    const renderPass: RenderPass = new RenderPass(this.scene, this.camera);
    const depthOfFieldEffect: DepthOfFieldEffect = new DepthOfFieldEffect(this.camera, {
      focalLength: 0.1,
      focusRange: 0.3,
      bokehScale: 5,
      resolutionX: this.width,
      resolutionY: this.height
    });
    const effectPass: EffectPass = new EffectPass(this.camera, depthOfFieldEffect);
    // Добавление эффектов
    this.postProcessingEffects = { renderPass, depthOfFieldEffect };
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(effectPass);
  }

  // Отрисовать небо
  private createSky(): void {
    if (this.scene) {
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const borderOSize: number = Math.max(oWidth, oHeight) * this.terrainService.outsideMapSize;
      const borderSize: number = borderOSize * DreamCeilSize;
      const width: number = (oWidth * DreamCeilSize) + (borderSize * 2);
      const height: number = (oHeight * DreamCeilSize) + (borderSize * 2);
      const size: number = Math.min(width, height);
      const { sky, sun, fog, atmosphere }: SkyBoxOutput = this.skyBoxService.getObject(
        this.renderer,
        size,
        this.dreamMap?.sky?.time ?? DreamSkyTime,
        this.dreamMapSettings
      );
      // Добавить к сцене
      this.scene.add(sky, sun, atmosphere);
      this.octree.add(sky);
      this.octree.update();
      this.scene.fog = fog;
      this.sun = sun;
      // Рендер
      this.render();
    }
  }

  // Отрисовать океан
  private createOcean(): void {
    if (this.scene) {
      const oWidth: number = this.dreamMap?.size?.width || DreamMapSize;
      const oHeight: number = this.dreamMap?.size?.height || DreamMapSize;
      const borderOSize: number = Math.max(oWidth, oHeight) * this.terrainService.outsideMapSize;
      const borderSize: number = borderOSize * DreamCeilSize;
      const width: number = (oWidth * DreamCeilSize) + (borderSize * 2);
      const height: number = (oHeight * DreamCeilSize) + (borderSize * 2);
      const heightPart: number = DreamCeilSize / DreamCeilParts;
      const z: number = heightPart * this.dreamMap.ocean.z;
      const geometry: PlaneGeometry = new PlaneGeometry(width, height, 1, 1);
      const position: Vector3 = new Vector3(0, z, 0);
      const sunDirection: Vector3 = new Vector3().subVectors(this.sun.position, position).normalize();
      // Создать океан
      this.ocean = new Water(geometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load("../../assets/dream-map/water/ocean.jpg", texture => texture.wrapS = texture.wrapT = RepeatWrapping),
        sunColor: this.sun.color,
        eye: this.camera.position,
        waterColor: 0x004587,
        distortionScale: 2,
        fog: true,
        sunDirection,
        side: FrontSide,
        alpha: 1
      });
      // Свойства
      this.ocean.material.transparent = true;
      this.ocean.material.alphaTest = 0;
      this.ocean.material.depthTest = true;
      this.ocean.material.depthWrite = true;
      this.ocean.rotation.x = AngleToRad(-90);
      this.ocean.position.set(position.x, position.y, position.z);
      this.ocean.material.uniforms.size.value = DreamCeilSize * 10;
      this.ocean.receiveShadow = true;
      this.ocean.name = DreamMapOceanName;
      // Туман
      AddMaterialBeforeCompile(this.ocean.material, shader => shader.fragmentShader = shader.fragmentShader.replace("#include <fog_fragment>", `
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
          #else
            float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
          #endif

          gl_FragColor.a = saturate(gl_FragColor.a - fogFactor);
        #endif
      `));
      // Добавить в сцену
      this.octree.add(this.ocean);
      this.scene.add(this.ocean);
      this.octree.update();
      this.render();
    }
  }

  // Отрисовать объекты
  private createTerrains(): Observable<void> {
    return this.terrainService.getObject(this.dreamMap).pipe(
      map(terrain => {
        this.scene.add(terrain);
        this.terrainMesh = terrain;
        this.octree.add(terrain);
        // Рендер
        this.render();
        this.octree.update();
      }),
      takeUntil(this.destroyed$)
    );
  }

  // Создание объектов
  private createObjects(): void {
    if (this.scene) {
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      // Цикл по ячейкам
      CreateArray(oWidth).map(y => CreateArray(oHeight).map(x => {
        const ceil: DreamMapCeil = this.getCeil(x, y);
        this.addObject(x, y, ceil.object ?? 0, ceil.terrain, true);
      }));
    }
  }

  // Создание курсора
  private createCursor(): void {
    const ringRadius: number = 0.5;
    const ringGeometry: CylinderGeometry = new CylinderGeometry(ringRadius, ringRadius, this.cursor.ring.height, this.cursor.ring.quality, 1, true);
    const ringMaterial: MeshPhongMaterial = new MeshPhongMaterial({
      emissive: 0x3f52b5,
      color: 0x3f52b5,
      transparent: true,
      alphaTest: 0.5,
      opacity: 0.5,
      side: DoubleSide,
      fog: false,
      depthWrite: true,
      depthTest: true
    });
    const mesh: Mesh = new Mesh(ringGeometry, ringMaterial);
    const light: PointLight = new PointLight(new Color(1, 1, 1), DreamCeilSize, DreamCeilSize * 3, 2);
    // Настройки
    // ringGeometry.rotateX(AngleToRad(-90));
    // Настройки
    light.name = this.cursor.names.light;
    mesh.name = this.cursor.names.ring;
    // Запомнить все данные
    this.cursor.group.position.set(-15, 20, -7);
    this.cursor.group.add(mesh, light);
    this.cursor.ring.geometry = ringGeometry;
    this.cursor.ring.material = ringMaterial;
    this.cursor.group.visible = false;
    this.scene.add(this.cursor.group);
  }





  // Рендер сцены
  render(): void {
    if (!!this.composer) {
      this.composer.render();
    }
  }

  // Обновление сцены
  private animate(): void {
    if (!!this.scene) {
      const heightPart: number = DreamCeilSize / DreamCeilParts;
      // Анимация
      requestAnimationFrame(this.animate.bind(this));
      // Обновить воду
      this.ocean.material.uniforms.time.value += heightPart * (this.oceanFlowSpeed / 10);
      // Анимация объектов
      ArrayForEach(Object.values(this.animateFunctions), f => f(), true);
      // Обновить сцену
      this.control.update();
      this.render();
      this.stats.update();
    }
  }

  // Удалить все объекты
  private clearScene(): void {
    if (this.scene) {
      // Очистить переменные
      this.cursor = undefined;
      this.control = undefined;
      this.terrainMesh = undefined;
      this.ocean = undefined;
      this.sun = undefined;
      // Удаление материалов
      const clearMaterial: (material: any) => void = material => {
        const textures = ArrayFilter(Object.entries(material), ([, texture]: [string, any]) => !!texture && !!texture?.dispose && typeof texture.dispose === "function");
        // Удалить текстуры
        ArrayForEach(textures, ([, texture]: [string, any]) => {
          texture.dispose();
          texture = undefined;
        }, true);
        // Удалить униформы
        ArrayForEach(Object.values(material), (o: any) => {
          if (!!o?.uniforms) {
            const value: any[] = Object.values(o.uniforms).map((o: any) => o?.value).filter(o => !!o && !!o.dispose);
            // Значения найдены
            if (!!value?.length) {
              o.dispose();
              o = undefined;
            }
          }
        });
        // Очистка
        material.dispose();
        material = undefined;
      };
      // Удаление объектов
      const clearThree: (node: any) => void = node => {
        // Потомки
        while (node.children.length > 0) {
          clearThree(node.children[0]);
          node.remove(node.children[0]);
          this.renderer.dispose();
        }
        // Геометрии
        if (!!node.geometry) {
          node.geometry.dispose();
          node.geometry = undefined;
        }
        // Материалы
        if (!!node.material) {
          Array.isArray(node.material) ?
            ArrayForEach(node.material, material => clearMaterial(material)) :
            clearMaterial(node.material);
          node.material = undefined;
        }
        // Очистка
        if (!!node?.clear && typeof node.clear === "function") {
          node.clear();
        }
        // Очистка
        if (!!node?.dispose && typeof node.dispose === "function") {
          node.dispose();
        }
        // Очистка
        node = undefined;
      }
      // Очистка
      clearThree(this.scene);
      // console.log(JSON.stringify(this.renderer.info.memory));
      // Очистить сцену
      this.clock.stop();
      this.stats.end();
      this.camera.clear();
      this.scene.clear();
      this.renderer.clear();
      // Очистить переменные
      this.clock = undefined;
      this.stats = undefined;
      this.camera = undefined;
      this.scene = undefined;
      this.renderer = undefined;
    }
  }





  // Добавить объект на карту
  // ? obj.0: Добавить объект по умолчанию
  private addObject(x: number, y: number, obj: number = -1, oldTerrain: number = DreamTerrain, force: boolean = false, removeDefault: boolean = true): void {
    if (obj >= 0) {
      const ceil: DreamMapCeil = this.getCeil(x, y);
      // Определение объекта
      obj = obj === 0 ? (ceil.object ?? 0) : obj;
      // Только если объект должен смениться
      if (ceil.object !== obj || (ceil.terrain !== oldTerrain && !ceil.object) || force) {
        this.removeObject(x, y, removeDefault);
        ceil.object = obj > 0 ? obj : ceil.object;
        // Данные объекта
        const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
        const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
        const size: number = oWidth * oHeight;
        const mixedObjects: (MapObject | MapObject[])[] = this.objectService.getObject(
          this.dreamMap,
          ceil,
          this.terrainMesh,
          this.clock,
          this.terrainService.displacementTexture,
          this.getClosestCeils(ceil),
          this.dreamMapSettings,
          removeDefault
        );
        // Получены объекты
        if (!!mixedObjects && !!mixedObjects?.length) {
          const objects: MapObject[][] = mixedObjects.map(mixedObject => Array.isArray(mixedObject) ? mixedObject : [mixedObject]);
          const defaultColor: Color = new Color();
          const defaultMatrix: Matrix4 = new Matrix4();
          const defaultSkew: Vector3 = new Vector3();
          const mapObjects: MapObject[] = objects.reduce((o, d) => ([...o, ...d]), []);
          // Цикл по объектам
          ArrayForEach(mapObjects, object => {
            if (!!object) {
              const count: number = object.count;
              const length: number = object.matrix?.length ?? 0;
              // Если у объекта есть фрагменты
              if (count > 0 && length > 0) {
                const type: string = object.type;
                const subType: string = object.subType;
                const splitBySubType: boolean = object.splitBySubType;
                const keyType: string = type + (splitBySubType ? "-" + subType : "");
                const oldObjects: ObjectSetting[] = this.objectSettings.filter(os => this.getFilterObjectsFunc(os, type, subType, splitBySubType));
                const isOldObject: boolean = !!oldObjects?.length;
                const mesh: ShearableInstancedMesh = isOldObject ? oldObjects[0].mesh : new ShearableInstancedMesh({
                  geometry: object.geometry,
                  material: object.material,
                  count: count * size,
                  noize: object?.noize
                });
                const coords: XYCoord = object.coords;
                const isDefault: boolean = object.isDefault;
                const startIndex: number = this.objectCounts[keyType] ?? 0;
                const indexKeys: number[] = CreateArray(count).map(i => startIndex + i);
                const translates: CoordDto[] = object.translates ?? [];
                const moreClosestsUpdate: boolean = !!object?.moreClosestsUpdate;
                const objectSetting: ObjectSetting = { coords, mesh, type, subType, splitBySubType, indexKeys, count, isDefault, translates, moreClosestsUpdate };
                let raycastCoords: MapObjectRaycastBoxData;
                // Цикл по ключам
                ArrayForEach(indexKeys, (index, k) => {
                  const hasMatrix: boolean = !!object.matrix[k];
                  // Установить параметры
                  mesh.setMatrixAt(index, object.matrix[k] ?? defaultMatrix);
                  mesh.setColorAt(index, object.color[k] ?? defaultColor);
                  mesh.setShearAt(index, object.skews[k] ?? defaultSkew);
                  mesh.setDistanceAt(index, anyToFloat(object.lodDistances[k], 0, 2));
                  // Коробка для пересечений
                  if (!!object?.raycastBox && hasMatrix) {
                    raycastCoords = GetInstanceBoundingBox(mesh, index, raycastCoords);
                  }
                }, true);
                // Функция анимации
                if (!!object.animate && !this.animateFunctions.hasOwnProperty(keyType)) {
                  this.animateFunctions[keyType] = object.animate;
                }
                // Обновить старый объект
                if (isOldObject) {
                  mesh.updateMatrix();
                  mesh.instanceMatrix.needsUpdate = true;
                  mesh.instanceColor.needsUpdate = true;
                  mesh.instanceShear.needsUpdate = true;
                }
                // Обновить новый объект
                else {
                  mesh.castShadow = object.castShadow;
                  mesh.receiveShadow = object.recieveShadow;
                  mesh.matrixAutoUpdate = false;
                  // Добавить на сцену
                  this.scene.add(mesh);
                }
                // Объект для пересечения
                if (!!raycastCoords) {
                  const allRaycastMesh: ObjectRaycastMesh[] = ArrayFilter(this.objectRaycastBoxes, ({ ceilCoords: { x, y } }) => x === ceil.coord.x && y === ceil.coord.y);
                  const isNewObject: boolean = !allRaycastMesh?.length;
                  const raycastMesh: Mesh = !isNewObject ? allRaycastMesh[0].mesh : new Mesh(ObjectRaycastGeometry.clone(), ObjectRaycastMaterial);
                  const [minX, maxX, minY, maxY, minZ, maxZ] = [...allRaycastMesh, raycastCoords]
                    .map(({ minX, maxX, minY, maxY, minZ, maxZ }) => ([minX, maxX, minY, maxY, minZ, maxZ]))
                    .reduce(([oMinX, oMaxX, oMinY, oMaxY, oMinZ, oMaxZ], [minX, maxX, minY, maxY, minZ, maxZ]) => ([
                      Math.min(minX, oMinX), Math.max(maxX, oMaxX),
                      Math.min(minY, oMinY), Math.max(maxY, oMaxY),
                      Math.min(minZ, oMinZ), Math.max(maxZ, oMaxZ),
                    ]), [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity]);
                  const width: number = maxX - minX;
                  const height: number = maxY - minY;
                  const depth: number = maxZ - minZ;
                  const scaleX: number = width / DreamCeilSize;
                  const scaleY: number = height / DreamCeilSize;
                  const scaleZ: number = depth / DreamCeilSize;
                  // Добавить новый элемент
                  this.objectRaycastBoxes.push({
                    ...raycastCoords,
                    objectId: mesh.uuid,
                    mesh: raycastMesh,
                    ceilCoords: {
                      x: ceil.coord.x,
                      y: ceil.coord.y,
                    }
                  });
                  // Обновить параметры
                  raycastMesh.geometry = ObjectRaycastGeometry.clone();
                  raycastMesh.scale.set(scaleX, scaleY, scaleZ);
                  raycastMesh.position.set(minX + width / 2, minY + height / 2, minZ + depth / 2);
                  raycastMesh.name = DreamMapObjectIntersectorName;
                  // Добавить объект
                  if (isNewObject) {
                    this.scene.add(raycastMesh);
                    this.octree.add(raycastMesh);
                  }
                  // Обновить объект
                  else {
                    this.octree.updateObject(raycastMesh);
                  }
                  // Обновить октодерево
                  if (!!this.octree.objectsDeferred?.length) {
                    this.octree.update();
                  }
                }
                // Общие настройки
                this.objectSettings.push(objectSetting);
                this.objectCounts[keyType] = !!this.objectCounts[keyType] ? this.objectCounts[keyType] + count : count;
                mesh.count = this.objectCounts[keyType];
              }
            }
          });
        }
      }
    }
    // Удаление объекта
    else {
      this.removeObject(x, y, removeDefault);
    }
  }

  // Удалить объект с карты
  private removeObject(x: number, y: number, removeDefault: boolean = true): void {
    const objectSettingKeys: number[] = this.getObjectSettingByCoords(x, y);
    const defaultColor: Color = new Color();
    const defaultMatrix: Matrix4 = new Matrix4();
    const defaultShear: Vector3 = new Vector3();
    const color: Color = defaultColor.clone();
    const matrix: Matrix4 = defaultMatrix.clone();
    const shear: Vector3 = defaultShear.clone();
    let distance: number = 0;
    const allRaycastMesh: ObjectRaycastMesh[] = ArrayFilter(this.objectRaycastBoxes, ({ ceilCoords: { x: tX, y: tY } }) => tX === x && tY === y);
    const allRaycastMeshLength = allRaycastMesh?.length ?? 0;
    let ksB: CustomObjectKey<string, number[]> = {};
    let kB: number;
    // Цикл по объектам
    ArrayForEach(objectSettingKeys, kA => {
      const isDefault: boolean = this.objectSettings[kA].isDefault;
      // Удалять объекты по умолчанию, если передан параметр их удаления
      if ((isDefault && removeDefault) || !isDefault) {
        const type: string = this.objectSettings[kA].type;
        const subType: string = this.objectSettings[kA].subType;
        const splitBySubType: boolean = this.objectSettings[kA].splitBySubType;
        const keyType: string = type + (splitBySubType ? "-" + subType : "");
        const mesh: ShearableInstancedMesh = this.objectSettings[kA].mesh;
        const lastIndexPreffix: number = this.objectCounts[keyType] ?? 0;
        const objectCount: number = this.objectSettings.filter(os => this.getFilterObjectsFunc(os, type, subType, splitBySubType))?.length - 1;
        // Обновить
        if (objectCount > 0) {
          ArrayForEach(this.objectSettings[kA].indexKeys, (index, k) => {
            const lastIndex: number = lastIndexPreffix - 1 - k;
            // Индекс последней геометрии
            kB = this.getObjectSettingKeyByIndex(lastIndex, type, splitBySubType ? subType : null, kB, ksB);
            // Перемещение данных
            if (index !== lastIndex) {
              const lastType: string = this.objectSettings[kB].type;
              const lastSubType: string = this.objectSettings[kB].subType;
              const lastSplitBySubType: boolean = this.objectSettings[kB].splitBySubType;
              const lastKeyType: string = lastType + (lastSplitBySubType ? "-" + lastSubType : "");
              const lastIndexKey: number = this.objectSettings[kB].indexKeys.findIndex(i => i === lastIndex);
              // Добавить в массив использований
              if (!ksB[lastKeyType]?.includes(kB)) {
                ksB[lastKeyType] = ksB[lastKeyType] ?? [];
                ksB[lastKeyType].push(kB);
              }
              // Получить матрицу и цвет
              mesh.getMatrixAt(lastIndex, matrix);
              mesh.getColorAt(lastIndex, color);
              mesh.getShearAt(lastIndex, shear);
              distance = mesh.getDistanceAt(lastIndex);
              // Переместить последний фрагмент
              mesh.setMatrixAt(index, matrix);
              mesh.setColorAt(index, color);
              mesh.setShearAt(index, shear);
              mesh.setDistanceAt(index, distance);
              // Удалить последний фрагмент
              mesh.setMatrixAt(lastIndex, defaultMatrix);
              mesh.setColorAt(lastIndex, defaultColor);
              mesh.setShearAt(lastIndex, defaultShear);
              mesh.setDistanceAt(lastIndex, 0);
              // Обновить
              this.objectSettings[kB].indexKeys[lastIndexKey] = index;
              this.objectSettings[kA].indexKeys[k] = -1;
            }
            // Очистка данных
            else {
              mesh.setMatrixAt(index, defaultMatrix);
              mesh.setColorAt(index, defaultColor);
              mesh.setShearAt(index, defaultShear);
              mesh.setDistanceAt(index, 0);
            }
            // Обновить количества
            this.objectCounts[keyType] -= 1;
            mesh.count -= 1;
          }, true);
          // Обновить
          mesh.instanceMatrix.needsUpdate = true;
          mesh.instanceColor.needsUpdate = true;
        }
        // Удалить
        else {
          delete this.animateFunctions[keyType];
          delete this.objectCounts[keyType];
          this.octree.remove(mesh);
          this.scene.remove(mesh);
          this.octree.update();
          mesh.geometry?.dispose();
          (mesh.material as Material)?.dispose();
          mesh.dispose();
          mesh.remove();
        }
      }
    }, true);
    // Очистка
    ArrayForEach(objectSettingKeys, kA => {
      const objectSettings: ObjectSetting = this.objectSettings[kA];
      // Отфильтровать
      if (!!objectSettings && ((objectSettings.isDefault && removeDefault) || !objectSettings.isDefault)) {
        this.objectSettings.splice(kA, 1);
      }
    }, true);
    // Удалить объект пересечений
    if (allRaycastMeshLength > 0) {
      ArrayForEach(allRaycastMesh, (raycastMesh, key) => {
        const index: number = this.objectRaycastBoxes.findIndex(obj => obj === raycastMesh);
        // Удалить элемент оз общего массива
        this.objectRaycastBoxes.splice(index, 1);
        // Удалить основной объект
        if (key + 1 === allRaycastMeshLength) {
          this.octree.remove(raycastMesh.mesh);
          this.scene.remove(raycastMesh.mesh);
          this.octree.update();
          raycastMesh.mesh.geometry?.dispose();
          (raycastMesh.mesh.material as Material)?.dispose();
        }
      }, true);
    }
  }

  // Удалить все объекты
  private clearObjects(): void {
    ArrayForEach(this.objectSettings, (objectSetting, k) => {
      const type: string = objectSetting.type;
      const subType: string = objectSetting.subType;
      const splitBySubType: boolean = objectSetting.splitBySubType;
      const keyType: string = type + (splitBySubType ? "-" + subType : "");
      const mesh: ShearableInstancedMesh = objectSetting.mesh;
      const typeLength: number = this.objectSettings.filter(os => this.getFilterObjectsFunc(os, type, subType, splitBySubType)).length;
      const allRaycastMesh: ObjectRaycastMesh[] = ArrayFilter(
        this.objectRaycastBoxes,
        ({ ceilCoords: { x: tX, y: tY } }) => tX === objectSetting.coords.x && tY === objectSetting.coords.y
      );
      const allRaycastMeshLength = allRaycastMesh?.length ?? 0;
      // Удалить настройки
      this.objectSettings.splice(k, 1);
      this.objectCounts[keyType] = 0;
      mesh.count = 0;
      // Удалить объекты
      if (typeLength <= 1) {
        mesh.dispose();
        mesh.removeFromParent();
        this.renderer.dispose();
        // Удалить объект пересечений
        if (allRaycastMeshLength > 0) {
          ArrayForEach(allRaycastMesh, (raycastMesh, key) => {
            const index: number = this.objectRaycastBoxes.findIndex(obj => obj === raycastMesh);
            // Удалить элемент оз общего массива
            this.objectRaycastBoxes.splice(index, 1);
            // Удалить основной объект
            if (key + 1 === allRaycastMeshLength) {
              this.octree.remove(raycastMesh.mesh);
              this.scene.remove(raycastMesh.mesh);
              this.octree.update();
              raycastMesh.mesh.remove();
            }
          }, true);
        }
        // Удаление
        delete this.animateFunctions[keyType];
      }
    }, true);
  }





  // Обновить параметры пост обработки
  private updatePostProcessors(): void {
    if (!!this.postProcessingEffects) {
      this.chairPositionX = this.width * 0.5;
      this.chairPositionY = LineFunc(this.height * 0.9, this.height * 0.5, this.control.getPolarAngle(), this.control.minPolarAngle, this.control.maxPolarAngle);
      const objects: Intersection[] = this.getIntercectionObject(this.chairPositionX, this.chairPositionY);
      const depthOfFieldEffect: DepthOfFieldEffect = this.postProcessingEffects.depthOfFieldEffect;
      const circleOfConfusionMaterial: CircleOfConfusionMaterial = depthOfFieldEffect.circleOfConfusionMaterial;
      const blendMode: BlendMode = depthOfFieldEffect.blendMode;
      const closestObject: Intersection = !!objects?.length ?
        objects.reduce((o, object) => !o || (!!o && object.distance < o.distance) ? object : o, null) :
        null;
      const distance: number = this.control.getDistance();
      const focusDistance: number = LineFunc(0.5, 0.4, distance, 0, this.control.maxDistance);
      // Обновить дальность
      blendMode.opacity.value = LineFunc(0.6, 1, distance, this.control.minDistance, this.control.maxDistance);
      depthOfFieldEffect.resolution.width = this.width;
      depthOfFieldEffect.resolution.height = this.height;
      // Найдены объекты
      depthOfFieldEffect.target = !!closestObject ? closestObject.point : this.control.target;
      circleOfConfusionMaterial.uniforms.focalLength.value = focusDistance;
      circleOfConfusionMaterial.uniforms.focusRange.value = focusDistance * 0.5;
    }
  }

  // Обновить статус свечения местности
  setTerrainHoverStatus(ceil: DreamMapCeil = null, oToolSize: number = 0): void {
    if (!!ceil && (ceil.coord.x !== this.cursor.coords?.x || ceil.coord.y !== this.cursor.coords?.y)) {
      const minY: number = Math.min(0, DreamMinHeight);
      const maxY: number = DreamMaxHeight;
      const fullCircle: number = 360;
      const circleStepAngle: number = fullCircle / this.cursor.ring.intersectionCount;
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const widthCorrect: number = -oWidth * DreamCeilSize / 2;
      const heightCorrect: number = -oHeight * DreamCeilSize / 2;
      const x: number = widthCorrect + (ceil.coord.x * DreamCeilSize) + (DreamCeilSize / 2);
      const y: number = heightCorrect + (ceil.coord.y * DreamCeilSize) + (DreamCeilSize / 2);
      const needUpdatePosition: boolean = this.cursor.group.position.x !== x || this.cursor.group.position.z !== y;
      // Пересчет позиции
      if (needUpdatePosition) {
        const toolSize: number = ((oToolSize * 2) + 1) * DreamCeilSize;
        const light: PointLight = this.cursor.group.getObjectByName(this.cursor.names.light) as PointLight;
        const ringRadius: number = toolSize / 2;
        let ringGeometry: CylinderGeometry = this.cursor.ring.geometry as CylinderGeometry;
        // const ringMaterial: MeshPhongMaterial = this.cursor.ring.material;
        const mesh: Mesh = this.cursor.group.getObjectByName(this.cursor.names.ring) as Mesh;
        // Координаты пересечений
        const yPositions: number[] = MapCycle(this.cursor.ring.intersectionCount + 1, step => {
          const lastStep: boolean = step === this.cursor.ring.intersectionCount;
          const xPos: number = lastStep ? x : x + (ringRadius * Cos(circleStepAngle * step));
          const yPos: number = lastStep ? y : y + (ringRadius * Sin(circleStepAngle * step));
          const objects: Intersection[] = this.getIntercectionObjectByCoords(xPos, yPos).filter(({ object }) => object === this.terrainMesh || object === this.ocean);
          // Вернуть позицию по Z
          return objects.reduce((o, { point: { y } }) => y > o ? y : o, minY);
        });
        const minYPosition: number = yPositions.reduce((o, y) => y < o ? y : o, maxY);
        const maxYPosition: number = yPositions.reduce((o, y) => y > o ? y : o, minY);
        const yCorrection: number = (maxYPosition - minYPosition) / 2;
        const height: number = maxYPosition - minYPosition + this.cursor.ring.height;
        const needUpdateGeometry: boolean = ringGeometry.parameters.radiusTop !== ringRadius ||
          ringGeometry.parameters.radiusBottom !== ringRadius ||
          ringGeometry.parameters.height !== height;
        // Общие настройки курсора
        this.cursor.coords = { x: ceil.coord.x, y: ceil.coord.y };
        this.cursor.group.visible = true;
        this.cursor.group.position.setX(x);
        this.cursor.group.position.setZ(y);
        this.cursor.group.position.setY(minYPosition + yCorrection);
        // Настройки освещения
        light.position.y = yCorrection + this.cursor.ring.height;
        // Обновить геометрию
        if (needUpdateGeometry) {
          ringGeometry.dispose();
          ringGeometry = new CylinderGeometry(ringRadius, ringRadius, height, this.cursor.ring.quality, 1, true);
          light.distance = toolSize;
          light.intensity = toolSize;
          light.power = Math.pow(toolSize, 2);
          mesh.geometry = ringGeometry;
          this.cursor.ring.geometry = ringGeometry;
        }
      }
    }
    // Убрать свечение
    else if (!ceil && !!this.cursor.coords) {
      this.cursor.group.visible = false;
      this.cursor.coords = null;
    }
  }

  // Обновить высоту местности
  setTerrainHeight(ceils: DreamMapCeil[], updateObjects: boolean = false): void {
    if (!!ceils?.length) {
      this.terrainService.updateDreamMap(this.dreamMap);
      this.terrainService.updateHeights(ceils);
      // Цикл по объектам
      if (updateObjects) {
        const usedCeils: DreamMapCeil[] = [];
        const size: number = 2;
        // Активные ячейки
        ArrayForEach(ceils, ceil => XYForEach((size * 2) + 1, (size * 2) + 1,
          (x, y) => ({ x: ceil.coord.x + x - size, y: ceil.coord.y + y - size }),
          ({ x, y }, cX, cY) => {
            const nCeil: DreamMapCeil = this.getCeil(x, y);
            // Исключить повторы ячеек
            if (!usedCeils.includes(nCeil)) {
              const corrX: number = Math.abs(cX - size);
              const corrY: number = Math.abs(cY - size);
              const isAdvanceCeil: boolean = (corrX === 2 && corrY < 2) || (corrX < 2 && corrY === 2);
              const objectSettings: ObjectSetting[] = ArrayFilter(this.objectSettings, ({ coords: { x, y } }) => nCeil.coord.x === x && nCeil.coord.y === y);
              const moreClosestsUpdate: boolean = isAdvanceCeil ? ArraySome(objectSettings, ({ moreClosestsUpdate }) => moreClosestsUpdate) : false;
              // Добавить ячейки
              if ((corrX < 2 && corrY < 2) || moreClosestsUpdate) {
                ArrayForEach(objectSettings, objectSetting => this.objectService.updateHeight(
                  objectSetting,
                  this.dreamMap,
                  nCeil,
                  this.terrainMesh,
                  this.clock,
                  this.terrainService.displacementTexture,
                  this.getClosestCeils(nCeil),
                  this.dreamMapSettings
                ), true);
                // Запомнить ячейку и не изменять больше
                usedCeils.push(nCeil);
              }
            }
          }
        ), true);
        // обновить пост отрисовку
        this.updatePostProcessors();
      }
    }
  }

  // Обновить текстуру местности
  setTerrain(ceils: DreamMapCeil[], oldTerrains: number[]): void {
    if (!!ceils?.length) {
      const usedCeils: DreamMapCeil[] = [];
      // Заменить местность
      this.terrainService.updateDreamMap(this.dreamMap);
      this.terrainService.updateMaterials(ceils);
      // Удалить/выставить объекты по умолчанию
      ceils
        .forEach((ceil, i) => {
          const objectSettings: ObjectSetting[] = this.objectSettings.filter(({ coords: { x, y } }) => ceil.coord.x === x && ceil.coord.y === y);
          let update: number = ceil.terrain !== oldTerrains[i] ? 1 : 0;
          // Если объект уже существует
          if (!!objectSettings?.length) {
            update += objectSettings.filter(objectSetting => {
              const newSubType: string = this.objectService.getSubType(ceil, this.getClosestCeils(ceil), objectSetting.type, objectSetting.subType);
              const oldSubType: string = objectSetting.subType;
              // Обновить объект
              return newSubType !== oldSubType;
            }).length;
          }
          // обновить
          if (update > 0) {
            this.addObject(ceil.coord.x, ceil.coord.y, ceil.object, oldTerrains[i], true);
          }
          // Больше не анализировать ячейку
          usedCeils.push(ceil);
        });
      // Удалить/выставить объекты по умолчанию в соседних ячейках
      ceils.forEach(ceil => {
        const nCeils: DreamMapCeil[] = Object
          .values(this.getClosestCeils(ceil))
          .map(({ coords: { x, y } }) => this.getCeil(x, y))
          .filter(ceil => !usedCeils.includes(ceil));
        // Добавить обратанне ячейки в массив
        nCeils.forEach(nCeil => {
          const objectSettings: ObjectSetting[] = this.objectSettings.filter(({ coords: { x, y } }) => nCeil.coord.x === x && nCeil.coord.y === y);
          let update: number = 0;
          // Если объект уже существует
          if (!!objectSettings?.length) {
            update += objectSettings.filter(objectSetting => {
              const newSubType: string = this.objectService.getSubType(nCeil, this.getClosestCeils(nCeil), objectSetting.type, objectSetting.subType);
              const oldSubType: string = objectSetting.subType;
              // Обновить объект
              return newSubType !== oldSubType;
            }).length;
          }
          // обновить
          if (update > 0) {
            this.addObject(nCeil.coord.x, nCeil.coord.y, nCeil.object, nCeil.terrain, true);
          }
          // Больше не анализировать ячейку
          usedCeils.push(nCeil);
        });
      });
    }
  }

  // Обновить уровень мирового океана
  setOceanHeight(oceanHeight: number): void {
    this.dreamMap.ocean.z = oceanHeight;
    // Параметры
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const z: number = heightPart * this.dreamMap.ocean.z;
    // Свойства
    this.ocean.position.setY(z);
  }

  // Посчитать полоение небесных светил
  setSkyTime(time: number): void {
    this.dreamMap.sky.time = time;
    // Установить параметры
    this.skyBoxService.setSkyTime(time, this.dreamMapSettings);
    // Обновить океан
    const sunDirection: Vector3 = new Vector3().subVectors(this.sun.position, this.ocean.position).normalize();
    this.ocean.material.uniforms.sunDirection.value = sunDirection;
    // Обновить рендер
    this.updatePostProcessors();
    // Обновить сцену
    this.render();
  }

  // Изменить фоновый рельеф
  setReliefType(type: ClosestHeightName): Observable<void> {
    this.terrainService.updateDreamMap(this.dreamMap);
    // Вернуть подписку
    return this.terrainService.updateRelief(type).pipe(
      tap(() => {
        const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
        const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
        // Цикл по ячейкам
        XYForEach(oWidth, oHeight, (x, y) => this.getCeil(x, y), ceil => {
          const objectSettings: ObjectSetting[] = ArrayFilter(this.objectSettings, ({ coords: { x, y } }) => ceil.coord.x === x && ceil.coord.y === y);
          // Если существуют объекты
          ArrayForEach(objectSettings, objectSetting => this.objectService.updateHeight(
            objectSetting,
            this.dreamMap,
            ceil,
            this.terrainMesh,
            this.clock,
            this.terrainService.displacementTexture,
            this.getClosestCeils(ceil),
            this.dreamMapSettings
          ), true);
        });
      }),
      takeUntil(this.destroyed$)
    );
  }

  // Настройки смазывания рельефа внутри карты
  setReliefRewrite(): void {
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    // Смазывание
    this.terrainService.updateDreamMap(this.dreamMap);
    this.terrainService.updateReliefRewrite();
    // Цикл по ячейкам
    XYForEach(oWidth, oHeight, (x, y) => this.getCeil(x, y), ceil => {
      const objectSettings: ObjectSetting[] = ArrayFilter(this.objectSettings, ({ coords: { x, y } }) => ceil.coord.x === x && ceil.coord.y === y);
      // Если существуют объекты
      ArrayForEach(objectSettings, objectSetting => this.objectService.updateHeight(
        objectSetting,
        this.dreamMap,
        ceil,
        this.terrainMesh,
        this.clock,
        this.terrainService.displacementTexture,
        this.getClosestCeils(ceil),
        this.dreamMapSettings
      ), true);
    });
  }

  // Изменить уровни детализации
  set3DSettings(settings: DreamMapSettings): Observable<void> {
    this.dreamMapSettings = settings;
    // Подписка на изменения
    return timer(5).pipe(
      take(1),
      map(() => {
        this.clearObjects();
        this.createObjects();
        this.setSkyTime(this.dreamMap.sky.time);
        this.render();
      }),
      takeUntil(this.destroyed$)
    );
  }

  // Установить объект
  setObject(ceils: DreamMapCeil[], newObject: number): void {
    const objectData: DreamMapObject = GetDreamMapObjectByID(newObject);
    const usedCeils: DreamMapCeil[] = [];
    // Цикл по ячейкам
    ArrayForEach(ceils, ceil => {
      const oldObjectData: DreamMapObject = GetDreamMapObjectByID(ceil.object);
      // Удаление
      if (newObject <= 0) {
        ceil.object = 0;
      }
      // Добавление объекта
      this.addObject(
        ceil.coord.x,
        ceil.coord.y,
        newObject > 0 ? newObject : 0,
        ceil.terrain,
        newObject > 0 ? false : true,
        newObject > 0 ? !objectData?.settings?.mixWithDefault : !oldObjectData?.settings?.mixWithDefault,
      );
      // Запомнить ячейку и не изменять больше
      usedCeils.push(ceil);
    }, true);
    // Удалить/выставить объекты по умолчанию в соседних ячейках
    ArrayForEach(ceils, ceil => {
      const nCeils: DreamMapCeil[] = Object
        .values(this.getClosestCeils(ceil))
        .map(({ coords: { x, y } }) => this.getCeil(x, y))
        .filter(ceil => !usedCeils.includes(ceil));
      // Добавить обратанне ячейки в массив
      ArrayForEach(nCeils, nCeil => {
        const objectSettings: ObjectSetting[] = this.objectSettings.filter(({ coords: { x, y } }) => nCeil.coord.x === x && nCeil.coord.y === y);
        let update: number = 0;
        // Если объект уже существует
        if (!!objectSettings?.length) {
          update += objectSettings.filter(objectSetting => {
            const oldSubType: string = objectSetting.subType;
            const newSubType: string = this.objectService.getSubType(nCeil, this.getClosestCeils(nCeil), objectSetting.type, oldSubType);
            // Обновить объект
            return newSubType !== oldSubType;
          }).length;
        }
        // Обновить объекты
        if (update > 0) {
          this.addObject(nCeil.coord.x, nCeil.coord.y, nCeil.object, nCeil.terrain, true);
        }
        // Больше не анализировать ячейку
        usedCeils.push(nCeil);
      }, true);
    }, true);
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
    xDimen: NumberDirection;
    yDimen: NumberDirection;
  };
}

// Данные о курсоре
interface CursorData {
  coords: XYCoord;
  ring: {
    quality: number;
    intersectionCount: number;
    height: number;
    geometry: CylinderGeometry;
    material: MeshPhongMaterial;
  },
  type: CursorType;
  group: Group;
  names: CustomObjectKey<"light" | "ring", string>;
}

// Интерфейс эффектов постобработки
interface PostProcessingEffects {
  renderPass: RenderPass;
  depthOfFieldEffect: DepthOfFieldEffect;
}

// Объект для определения столкновений с объектами
interface ObjectRaycastMesh extends MapObjectRaycastBoxData {
  ceilCoords: XYCoord;
  objectId: string;
  mesh?: Mesh;
}

// Перечисление типов курсора
export enum CursorType {
  default,
  planeTop,
  planeBottom,
  planeFlat,
}





// Геометрия и материал для объектов пересечения
const ObjectRaycastGeometry: BoxGeometry = new BoxGeometry(DreamCeilSize, DreamCeilSize, DreamCeilSize);
const ObjectRaycastMaterial: LineBasicMaterial = new LineBasicMaterial({
  color: 0xbb00bb,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  side: DoubleSide
});

// Стартовый объект курсора
const DefaultCursorData: CursorData = {
  coords: null,
  ring: {
    quality: 24,
    intersectionCount: 6,
    height: (DreamCeilParts / DreamCeilSize) * 0.03,
    geometry: null,
    material: null,
  },
  type: CursorType.default,
  group: new Group(),
  names: {
    light: "pointLight",
    ring: "ring"
  }
};
