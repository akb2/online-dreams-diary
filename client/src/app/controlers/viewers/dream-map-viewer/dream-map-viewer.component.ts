import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { Octree, OctreeRaycaster } from "@brakebein/threeoctree";
import { AngleToRad, CustomObjectKey, IsOdd } from "@_models/app";
import { DreamMap, DreamMapCeil, WaterType, XYCoord } from "@_models/dream-map";
import { DreamCameraMaxZoom, DreamCameraMinZoom, DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamMinHeight, DreamObjectDetalization, DreamObjectElmsValues, DreamSkyTime, DreamTerrain, DreamWaterDefHeight } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectService, MapObject } from "@_services/dream-map/object.service";
import { DreamMapSkyBoxService, FogFar, SkyBoxOutput } from "@_services/dream-map/skybox.service";
import { ClosestHeights, DreamMapTerrainService } from "@_services/dream-map/terrain.service";
import { forkJoin, fromEvent, of, Subject, throwError, timer } from "rxjs";
import { skipWhile, switchMap, takeUntil, takeWhile, tap } from "rxjs/operators";
import { BufferGeometry, CanvasTexture, CineonToneMapping, Clock, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, FrontSide, Group, InstancedMesh, Intersection, Material, Mesh, MeshStandardMaterial, MOUSE, Object3D, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, RepeatWrapping, RingGeometry, Scene, sRGBEncoding, TextureLoader, Vector3, WebGLRenderer } from "three";
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
  evenlyMaxDiff: number = Math.round(DreamCeilParts * 1.5);
  private contextType: string = "webgl";
  private waitContext: number = 30;
  private mouseMoveLimit: number = 5;

  private rotateSpeed: number = 1.4;
  private moveSpeed: number = DreamCeilSize * 14;
  private zoomSpeed: number = DreamCeilSize;
  private minAngle: number = 0;
  private maxAngle: number = 85;
  private drawShadows: boolean = DreamObjectDetalization !== DreamObjectElmsValues.VeryLow;
  private oceanFlowSpeed: number = 3;

  private lastMouseMove: number = 0;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private octree: Octree;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private clock: Clock;
  private terrainMesh: Mesh;
  private ocean: Water;
  private sun: DirectionalLight;
  private animateFunctions: CustomObjectKey<number, CustomObjectKey<number, Function>> = {};
  private cursor: CursorData = {
    coords: null,
    borderSize: DreamCeilSize * 0.02,
    zOffset: 0.0001,
    ring: {
      quality: 12,
      zOffset: (DreamCeilParts / DreamCeilSize) * 0.02,
      height: (DreamCeilParts / DreamCeilSize) * 0.002,
      repeats: 60,
      displacementMap: null,
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
  stats: Stats;
  hoverCoords: XYCoord = null;

  loading: boolean = false;
  ready: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    if (this.isBorder(x, y)) {
      return this.getBorderCeil(x, y);
    }
    // Обычная ячейка
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) ?? this.getDefaultCeil(x, y);
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
      terrain: this.dreamMap.land.type,
      object: null,
      coord: {
        x,
        y,
        z: this.dreamMap.land.z,
        originalZ: this.dreamMap.land.z
      }
    };
  }

  // Объект по событию
  private getEventObject(event: MouseEvent): Intersection[] {
    if (event.target === this.canvas.nativeElement) {
      const far: number = FogFar * DreamCeilSize;
      const raycaster: OctreeRaycaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, far);
      const x: number = ((event.clientX - this.canvas.nativeElement.getBoundingClientRect().left) / this.width) * 2 - 1;
      const y: number = -(((event.clientY - this.canvas.nativeElement.getBoundingClientRect().top) / this.height) * 2 - 1);
      // Настройки
      raycaster.setFromCamera({ x, y }, this.camera)
      // Объекты в фокусе
      const intersect: Intersection[] = raycaster.intersectOctreeObjects(this.octree.search(raycaster.ray.origin, far, true, raycaster.ray.direction));
      // Обработка объектов
      return intersect?.length ? intersect : null;
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
      camera: {
        target: {
          x: this.control.target.x,
          y: this.control.target.y,
          z: this.control.target.z,
        },
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z,
        }
      },
      dreamerWay: [],
      size: this.dreamMap.size,
      ocean: {
        type: this.dreamMap?.ocean?.type ?? WaterType.pool,
        material: this.dreamMap?.ocean?.material ?? 1,
        z: this.dreamMap?.ocean?.z ?? DreamWaterDefHeight
      },
      land: {
        type: this.dreamMap?.land?.type ?? DreamTerrain,
        z: this.dreamMap?.land?.z ?? DreamDefHeight
      },
      sky: {
        time: this.dreamMap?.sky?.time ?? DreamSkyTime
      }
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
        return [k.toString(), c.coord.z * heightPart, c.terrain, c.object?.id ?? 0];
      })
      .reduce((o, [k, height, terrain, object]) => ({
        ...o,
        [k as keyof ClosestHeights]: { height, terrain, object }
      }), {} as ClosestHeights);
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
    private skyBoxService: DreamMapSkyBoxService,
    private terrainService: DreamMapTerrainService,
    private alphaFogService: DreamMapAlphaFogService,
    private objectService: DreamMapObjectService
  ) { }

  ngOnInit() {
    forkJoin([
      fromEvent(window, "resize", () => this.onWindowResize()),
      fromEvent(document, "mousemove", this.onMouseMove.bind(this)),
      fromEvent(document, "mousedown", this.onMouseClick.bind(this)),
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
    this.destroy$.next();
    this.destroy$.complete();
    // Очистить сцену
    this.clearScene();
  }





  // Изменение позиции камеры
  private onCameraChange(event: OrbitControls): void {
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

  // Создание 3D просмотра
  private create3DViewer(): void {
    this.loading = false;
    this.ready = true;
    this.changeDetectorRef.detectChanges();
    // Создание сцены
    this.createScene();
    this.createSky();
    this.createOcean();
    this.createTerrains();
    this.createObjects();
    this.createCursor();
    // События
    this.animate();
    fromEvent(this.control, "change", (event) => this.onCameraChange(event.target))
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    // Обновить
    this.control.update();
  }

  // Создание сцены
  private createScene(): void {
    const oWidth: number = this.dreamMap?.size?.width || DreamMapSize;
    const oHeight: number = this.dreamMap?.size?.height || DreamMapSize;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.terrainService.outsideMapSize;
    const octreeSize: number = Math.max(oWidth, oHeight) + (borderOSize * 2);
    // Отрисовщик
    this.renderer = new WebGLRenderer({
      context: this.canvas.nativeElement.getContext(this.contextType),
      canvas: this.canvas.nativeElement,
      antialias: true,
      alpha: true,
      precision: "highp",
      powerPreference: "high-performance",
      // logarithmicDepthBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.sceneColor, 1);
    this.renderer.shadowMap.enabled = this.drawShadows;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMapping = CineonToneMapping;
    this.renderer.physicallyCorrectLights = true;
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
      undeferred: false,
      depthMax: octreeSize,
      objectsThreshold: 8,
      overlapPct: 0.05,
      scene: this.scene
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
    // Статистика
    this.stats = Stats();
    this.statsBlock.nativeElement.appendChild(this.stats.dom);
    // Таймер
    this.clock = new Clock();
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
      const { sky, sun, fog, atmosphere }: SkyBoxOutput = this.skyBoxService.getObject(this.renderer, size, this.dreamMap?.sky?.time ?? DreamSkyTime);
      // Добавить к сцене
      this.scene.add(sky, sun, atmosphere);
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
      // Создать океан
      this.ocean = new Water(geometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new TextureLoader().load("../../assets/dream-map/water/ocean.jpg", texture => texture.wrapS = texture.wrapT = RepeatWrapping),
        sunColor: this.sun.color,
        eye: this.camera.position,
        waterColor: 0x001E33,
        distortionScale: 2,
        fog: true,
        sunDirection: this.sun.position,
        side: FrontSide
      });
      // Свойства
      this.ocean.material = this.alphaFogService.getShaderMaterial(this.ocean.material);
      this.ocean.rotation.x = AngleToRad(-90);
      this.ocean.position.set(0, z, 0);
      this.ocean.material.uniforms.size.value = DreamCeilSize * 10;
      this.ocean.receiveShadow = true;
      // Добавить в сцену
      this.scene.add(this.ocean);
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
      this.octree.add(terrain, { useVertices: false, useFaces: false });
      // Рендер
      this.render();
      this.octree.update();
    }
  }

  // Создание объектов
  private createObjects(): void {
    if (this.scene) {
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const borderOSize: number = 0;
      const width: number = oWidth + (borderOSize * 2);
      const height: number = oHeight + (borderOSize * 2);
      // Цикл по ячейкам
      const objects: MapObject[] = Array.from(Array(height).keys()).map(y => y - borderOSize)
        .map(y => Array.from(Array(width).keys()).map(x => x - borderOSize)
          .map(x => {
            const ceil: DreamMapCeil = this.getCeil(x, y);
            const object: MapObject | MapObject[] = this.objectService.getObject(
              this.dreamMap,
              this.getCeil(x, y),
              this.terrainMesh,
              this.clock,
              this.terrainService.displacementCanvas,
              this.getClosestCeils(ceil)
            );
            // Вернуть массив объектов
            return Array.isArray(object) ? object : [object];
          }))
        .reduce((v, o) => ([...o, ...v]), [])
        .reduce((v, o) => ([...o, ...v]), [])
        .filter(object => !!object);
      const types: string[] = Array.from(new Set(objects.map(({ type }) => type)));
      const counts: number[] = types.map(type => objects.filter(({ type: t }) => t === type).map(obj => obj.count).reduce((c, o) => o + c, 0));
      const meshes: InstancedMesh[] = types.map((type, k) => {
        const filterObjects: MapObject[] = objects.filter(({ type: t }) => t === type);
        const geometry: BufferGeometry = filterObjects[0].geometry;
        const material: Material = filterObjects[0].material;
        const count: number = counts[k];
        // Вернуть новую геометрию
        return new InstancedMesh(geometry, material, count);
      }).filter(mesh => !!mesh);
      // Добавить объект
      meshes.forEach((mesh, i) => {
        const type: string = types[i];
        const filterObjects: MapObject[] = objects.filter(({ type: t }) => t === type);
        const castShadow: boolean = filterObjects[0].castShadow;
        const recieveShadow: boolean = filterObjects[0].recieveShadow;
        let index: number = 0;
        // Настройки
        mesh.castShadow = castShadow;
        mesh.receiveShadow = recieveShadow;
        mesh.matrixAutoUpdate = false;
        // Цикл по ячейкам
        filterObjects.forEach(object => {
          const count: number = object.count;
          // Цикл по матрицам
          Array.from(Array(count).keys()).forEach(i3 => {
            mesh.setMatrixAt(index, object.matrix[i3]);
            // Цвет
            if (!!object.color[i3]) {
              mesh.setColorAt(index, object.color[i3]);
            }
            // Следующий индекс
            index++;
          });
          // Функция анимации
          if (!!object.animate) {
            this.animateFunctions[object.coords.y] = this.animateFunctions[object.coords.y] ?? {};
            this.animateFunctions[object.coords.y][object.coords.x] = object.animate;
          }
        });
        // Настройки
        mesh.updateMatrix();
      });
      // Добавить на сцену
      this.scene.add(...meshes);
      // Рендер
      this.render();
    }
  }

  // Создание курсора
  private createCursor(): void {
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const ringDisplacementMap: CanvasTexture = new CanvasTexture(this.terrainService.displacementCanvas);
    const toolSize: number = 1;
    const ringInnerRadius: number = toolSize / 2;
    const ringOuterRadius: number = ringInnerRadius + this.cursor.borderSize;
    const ringGeometry: RingGeometry = new RingGeometry(ringInnerRadius, ringOuterRadius, this.cursor.ring.quality, 1);
    const ringMaterial: MeshStandardMaterial = new MeshStandardMaterial({
      emissive: new Color(0.8, 0.3, 1),
      displacementMap: ringDisplacementMap,
      displacementScale: DreamMaxHeight * heightPart,
      side: DoubleSide,
      fog: false,
    });
    const ringSpacing: number = this.cursor.ring.height / this.cursor.ring.repeats;
    const mesh: InstancedMesh = new InstancedMesh(ringGeometry, ringMaterial, this.cursor.ring.repeats);
    const dummy: Object3D = new Object3D();
    const light: PointLight = new PointLight(new Color(1, 1, 1), DreamCeilSize, DreamCeilSize * 3, 2);
    // Настройки
    mesh.matrixAutoUpdate = false;
    ringGeometry.rotateX(AngleToRad(-90));
    // Цикл по элементам
    Array.from(Array(this.cursor.ring.repeats).keys()).map(i => {
      dummy.position.y = i * ringSpacing;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    // Настройки
    light.name = this.cursor.names.light;
    mesh.name = this.cursor.names.ring;
    ringDisplacementMap.encoding = sRGBEncoding;
    mesh.updateMatrix();
    // Запомнить все данные
    this.cursor.group.position.set(0, 20, 0);
    this.cursor.group.add(mesh, light);
    this.cursor.ring.displacementMap = ringDisplacementMap;
    this.cursor.ring.geometry = ringGeometry;
    this.cursor.ring.material = ringMaterial;
    this.cursor.group.visible = false;
    this.scene.add(this.cursor.group);
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
      // Анимация объектов
      Object.values(this.animateFunctions).forEach(o => Object.values(o).forEach(f => f()));
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
      this.cursor.ring.displacementMap.dispose();
      this.cursor.ring.displacementMap = undefined;
      this.cursor = undefined;
      this.control = undefined;
      this.terrainMesh = undefined;
      this.ocean = undefined;
      this.sun = undefined;
      // Удаление материалов
      const clearMaterial: (material: any) => void = material => {
        // Удалить текстуры
        const textures = Object.entries(material)
          .filter(([, texture]: [string, any]) => !!texture && !!texture?.dispose && typeof texture.dispose === "function");
        textures.forEach(([, texture]: [string, any]) => {
          texture.dispose();
          texture = undefined;
        });
        // Удалить униформы
        Object.values(material)
          .filter((o: any) => !!o?.uniforms)
          .map((o: any) => Object.values(o.uniforms).map((o: any) => o?.value).filter(o => !!o).filter(o => !!o.dispose))
          .filter(o => !!o?.length)
          .forEach((o: any[]) => o.forEach(o => {
            o.dispose();
            o = undefined;
          }));
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
            node.material.forEach(material => clearMaterial(material)) :
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
      console.log(JSON.stringify(this.renderer.info.memory));
      clearThree(this.scene);
      console.log(JSON.stringify(this.renderer.info.memory));
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





  // Обновить статус свечения местности
  setTerrainHoverStatus(ceil: DreamMapCeil = null, oToolSize: number = 0): void {
    if (!!ceil && (ceil.coord.x !== this.cursor.coords?.x || ceil.coord.y !== this.cursor.coords?.y)) {
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const borderOSize: number = this.terrainService.outsideMapSize * Math.max(oWidth, oHeight);
      const widthCorrect: number = -oWidth * DreamCeilSize / 2;
      const heightCorrect: number = -oHeight * DreamCeilSize / 2;
      const borderSize: number = borderOSize * DreamCeilSize;
      const width: number = (oWidth + (borderOSize * 2)) * DreamCeilSize;
      const height: number = (oHeight + (borderOSize * 2)) * DreamCeilSize;
      const x: number = widthCorrect + (ceil.coord.x * DreamCeilSize) + (DreamCeilSize / 2);
      const y: number = heightCorrect + (ceil.coord.y * DreamCeilSize) + (DreamCeilSize / 2);
      const sX: number = (borderSize + (ceil.coord.x * DreamCeilSize)) * this.terrainService.geometryQuality;
      const sY: number = (borderSize + (ceil.coord.y * DreamCeilSize)) * this.terrainService.geometryQuality;
      const wdth: number = (((oWidth * DreamCeilSize) + (borderSize * 2)) * this.terrainService.geometryQuality) + 1;
      const vertexes: Float32BufferAttribute = this.terrainMesh.geometry.getAttribute("position") as Float32BufferAttribute;
      const quality: number = this.terrainService.geometryQuality + 1;
      const qualityCenterCount: number = IsOdd(quality) ? 1 : 2;
      const qualitySpacing: number = (quality - qualityCenterCount) / 2;
      const toolSize: number = (oToolSize * 2) + 1;
      const light: PointLight = this.cursor.group.getObjectByName(this.cursor.names.light) as PointLight;
      const ringInnerRadius: number = toolSize / 2;
      const ringOuterRadius: number = ringInnerRadius + this.cursor.borderSize;
      const ringGeometry: RingGeometry = this.cursor.ring.geometry;
      const needUpdateGeometry: boolean = ringGeometry.parameters.innerRadius !== ringInnerRadius || ringGeometry.parameters.outerRadius !== ringOuterRadius;
      const ringSize: number = toolSize + (this.cursor.borderSize * 2);
      const displacementRepeatX: number = ringSize / width;
      const displacementRepeatY: number = ringSize / height;
      const displacementOffsetX: number = ((1 - displacementRepeatX) / 2) + ((x - (DreamCeilSize / 2)) * (100 / width) / 100);
      const displacementOffsetY: number = ((1 - displacementRepeatY) / 2) - ((y - (DreamCeilSize / 2)) * (100 / height) / 100);
      const ringTexture: CanvasTexture = this.cursor.ring.displacementMap;
      const ringMaterial: MeshStandardMaterial = this.cursor.ring.material;
      const mesh: InstancedMesh = this.cursor.group.getObjectByName(this.cursor.names.ring) as InstancedMesh;
      // Поиск максимальной высоты
      const z: number = Array.from(Array(qualityCenterCount).keys()).map(h => h + qualitySpacing)
        .map(h => Array.from(Array(qualityCenterCount).keys()).map(w => w + qualitySpacing).map(w => {
          const index: number = ((sY + h) * wdth) + sX + w;
          return vertexes.getZ(index);
        }))
        .reduce((o, z) => ([...o, ...z]), [])
        .reduce((o, z) => o < z ? z : o, 0);
      // Общие настройки курсора
      this.cursor.coords = { x: ceil.coord.x, y: ceil.coord.y };
      this.cursor.group.visible = true;
      this.cursor.group.position.setX(x);
      this.cursor.group.position.setY(z + this.cursor.zOffset);
      this.cursor.group.position.setZ(y);
      // Настройки освещения
      light.distance = toolSize;
      light.intensity = toolSize;
      light.power = Math.pow(toolSize, 2);
      // Обновить геометрию
      if (needUpdateGeometry) {
        ringGeometry.parameters.innerRadius = ringInnerRadius;
        ringGeometry.parameters.outerRadius = ringOuterRadius;
        mesh.matrix.makeScale(toolSize, 1, toolSize);
      }
      // Настройки кольца границы
      ringMaterial.displacementBias = -z + this.cursor.ring.zOffset;
      ringTexture.repeat.set(displacementRepeatX, displacementRepeatY);
      ringTexture.offset.set(displacementOffsetX, displacementOffsetY);
    }
    // Убрать свечение
    else if (!ceil && !!this.cursor.coords) {
      this.cursor.group.visible = false;
      this.cursor.coords = null;
    }
  }

  // Обновить высоту местности
  setTerrainHeight(ceil: DreamMapCeil, isLastCeils: boolean = false): void {
  }

  // Обновить текстуру местности
  setTerrain(ceil: DreamMapCeil, isLastCeils: boolean = false): void {
    if (!!ceil) {
      // this.terrainService.updateDreamMap(this.dreamMap);
      // this.terrainService.createMaterials(ceil.coord.x, ceil.coord.y, -1, isLastCeils);
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

  // Обновить уровень окружающего ландшафта
  setLandHeight(landHeight: number): void {
  }

  // Посчитать полоение небесных светил
  setSkyTime(time: number): void {
    this.dreamMap.sky.time = time;
    // Обновить сцену
    this.skyBoxService.setSkyTime(time);
    this.render();
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

// Данные о курсоре
interface CursorData {
  coords: XYCoord;
  borderSize: number;
  zOffset: number;
  ring: {
    quality: number;
    zOffset: number;
    repeats: number;
    height: number;
    displacementMap: CanvasTexture;
    geometry: RingGeometry;
    material: MeshStandardMaterial;
  },
  type: CursorType;
  group: Group;
  names: CustomObjectKey<"light" | "ring", string>;
}

// Перечисление типов курсора
export enum CursorType {
  default,
  planeTop,
  planeBottom,
  planeFlat,
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
