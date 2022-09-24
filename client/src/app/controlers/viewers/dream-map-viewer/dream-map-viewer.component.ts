import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { AngleToRad } from "@_models/app";
import { DreamMap, DreamMapCeil, MapTerrain, SkyBoxLightTarget, WaterType } from "@_models/dream-map";
import { SkyBoxResult, SkyBoxService } from "@_services/dream-map/skybox.service";
import { ClosestHeights, MapTerrains, TerrainDrawData, TerrainService } from "@_services/dream-map/terrain.service";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMapSize, DreamMaxHeight, DreamMinHeight, DreamSkyBox, DreamTerrain, DreamWaterDefHeight } from "@_services/dream.service";
import { forkJoin, fromEvent, of, Subject, throwError, timer } from "rxjs";
import { skipWhile, switchMap, takeUntil, takeWhile, tap } from "rxjs/operators";
import { BufferGeometry, CameraHelper, Clock, Color, FrontSide, Intersection, Light, Material, Mesh, MeshPhongMaterial, MeshStandardMaterial, MOUSE, Object3D, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, Raycaster, RepeatWrapping, Scene, TextureLoader, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { Water } from "three/examples/jsm/objects/Water";





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
  @ViewChild("miniMap") private miniMap: ElementRef;
  @ViewChild("helper") private helper: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private width: number = 0;
  private height: number = 0;
  private sceneColor: number = 0x000000;
  private ceilSize: number = DreamCeilSize;
  private ceilHeightParts: number = DreamCeilParts;
  minCeilHeight: number = DreamMinHeight;
  maxCeilHeight: number = DreamMaxHeight;
  evenlyMaxDiff: number = Math.round(this.ceilHeightParts * 1.5);
  private contextType: string = "webgl";
  private waitContext: number = 30;

  private successHighlight: number = 0x2f2f2f;

  private miniMapCeilSize: number = 5;
  private miniMapCeilBlur: number = 1;
  private rotateSpeed: number = 1.4;
  private moveSpeed: number = this.ceilSize * 14;
  private zoomSpeed: number = 1.5;
  private zoomMin: number = this.ceilSize;
  private zoomMax: number = this.ceilSize * 20;
  private minAngle: number = 0;
  private maxAngle: number = 80;
  private distance: number = 65;
  private showHelpers: boolean = false;
  private drawShadows: boolean = false;
  showMiniMap: boolean = true;

  private imageData: ImageData;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private clock: Clock;
  private terrainMeshes: Mesh[] = [];
  private borderMeshes: Mesh[] = [];
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
      if (intersects.length > 0 && intersects.some(({ object: { userData: { hoverEvent } } }) => hoverEvent)) {
        return intersects.find(({ object: { userData: { hoverEvent } } }) => hoverEvent) ?? null;
      }
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
    const heightPart: number = this.ceilSize / this.ceilHeightParts;
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
          !((this.showMiniMap && this.miniMap) || this.showMiniMap) ||
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
              this.drawMiniMap();
              this.createScene();
              this.createSky();
              this.createTerrains();
              this.createOcean();
              this.createBorder();
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
    // Очистить память
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
    if (this.renderer) {
      const object: Intersection<Object3D<Event>> = this.getEventObject(event);
      // Найден объект
      if (object) {
        const { ceil } = object.object.userData as MeshUserData;
        const width: number = this.dreamMap?.size?.width || DreamMapSize;
        const height: number = this.dreamMap?.size?.height || DreamMapSize;
        const heightPart: number = this.ceilSize / this.ceilHeightParts;
        const x: number = (object.point.x / this.ceilSize) + (width / 2);
        const y: number = (object.point.z / this.ceilSize) + (height / 2);
        // Обратный вызов
        if (ceil.coord.x >= 0 && ceil.coord.y >= 0) {
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

  // Клик мышкой
  private onMouseClick(event: MouseEvent): void {
    if (event.button === 1 && event.target === this.canvas.nativeElement) {
      event.preventDefault();
    }
    // Движение мышкой
    this.onMouseMove(event);
  }





  // Отрисовать миникарту
  private drawMiniMap(x: number = -1, y: number = -1, bluring: boolean = true): void {
    if (this.showMiniMap && this.miniMap) {
      const canvas: HTMLCanvasElement = this.miniMap.nativeElement as HTMLCanvasElement;
      const context: CanvasRenderingContext2D = canvas.getContext("2d");
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const width: number = oWidth * this.miniMapCeilSize;
      const height: number = oHeight * this.miniMapCeilSize;
      const cYs: number[] = Array.from(Array(oHeight).keys());
      const cXs: number[] = Array.from(Array(oWidth).keys());
      const blurs: number[] = Array.from(Array((this.miniMapCeilBlur * 2) + 1).keys()).map(v => v - this.miniMapCeilBlur);
      // Отрисовка одной ячейки
      if (x >= 0 && y >= 0) {
        this.drawMiniMapCeil(x, y);
        // Запомнить карту
        this.imageData = context.getImageData(0, 0, width, height);
      }
      // Обход ячеек
      else {
        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = false;
        // Обход ячеек
        cYs.forEach(cY => cXs.forEach(cX => this.drawMiniMapCeil(cX, cY)));
        // Запомнить карту
        this.imageData = context.getImageData(0, 0, width, height);
      }
      // Размытие карты
      if (bluring) {
        context.globalAlpha = 0.5;
        blurs.forEach(y => blurs.forEach(x => context.drawImage(canvas, x, y)));
        context.globalAlpha = 1;
      }
    }
  }

  // Отрисовать одну ячейку миникарты
  private drawMiniMapCeil(x: number, y: number): void {
    const canvas: HTMLCanvasElement = this.miniMap.nativeElement as HTMLCanvasElement;
    const context: CanvasRenderingContext2D = canvas.getContext("2d");
    const ceil: DreamMapCeil = this.getCeil(x, y);
    const terrain: MapTerrain = MapTerrains.find(({ id }) => id === ceil.terrain) ?? MapTerrains.find(({ id }) => id === 1);
    const color: Color = terrain.color;
    const sX: number = x * this.miniMapCeilSize;
    const sY: number = y * this.miniMapCeilSize;
    // Вставить карту
    if (this.imageData) {
      context.putImageData(this.imageData, 0, 0);
    }
    // Нарисовать квадрат
    context.fillStyle = "#" + color.getHexString();
    context.fillRect(sX, sY, this.miniMapCeilSize, this.miniMapCeilSize);
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
  private createTerrains(): void {
    if (this.scene) {
      const width: number = this.dreamMap?.size?.width || DreamMapSize;
      const height: number = this.dreamMap?.size?.height || DreamMapSize;
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      // Цикл по объектам
      for (let y = -1; y < width + 1; y++) {
        for (let x = -1; x < height + 1; x++) {
          const ceil: DreamMapCeil = this.getCeil(x, y);
          const closestHeights: ClosestHeights = this.getClosestHeights(ceil);
          // Обработка
          ceil.coord.z = ceil.coord.z > this.maxCeilHeight ?
            this.maxCeilHeight :
            (ceil.coord.z < this.minCeilHeight ? this.minCeilHeight : ceil.coord.z);
          // Местность
          const { land }: TerrainDrawData = this.terrainService.getObject(
            ceil.terrain,
            this.ceilSize,
            heightPart * ceil.coord.z,
            closestHeights,
            this.renderer,
          );
          // Позиция элементов
          const posX: number = (x - (width / 2)) * this.ceilSize;
          const posY: number = (y - (height / 2)) * this.ceilSize;
          const posZ: number = -heightPart * this.maxCeilHeight;
          // Настройки объекта
          land.userData = { ceil, hoverEvent: true } as MeshUserData;
          land.position.set(posX, posZ, posY);
          // Добавить объект на карту
          this.terrainMeshes.push(land);
          this.scene.add(land);
        }
      }
      // Рендер
      this.render();
    }
  }

  // Отрисовать границы
  private createBorder(): void {
    if (this.scene) {
      const oWidth: number = (this.dreamMap?.size?.width || DreamMapSize) + 2;
      const oHeight: number = (this.dreamMap?.size?.height || DreamMapSize) + 2;
      const oSize: number = Math.max(oWidth * 2, oHeight * 2) * this.ceilSize;
      const width: number = oWidth * this.ceilSize;
      const height: number = oHeight * this.ceilSize;
      const size: number = oSize * this.ceilSize;
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      const z: number = (-this.maxCeilHeight + this.dreamMap.land.z) * heightPart;
      const posCorr: number = this.ceilSize / 2;
      const posX: number = (width / 2) + (size / 2);
      const posY: number = (height / 2) + (size / 2);
      // Материал
      const horMaterial: MeshStandardMaterial = this.terrainService.getMaterial(this.dreamMap.land.type, false, this.renderer);
      horMaterial.map.repeat.set(oSize, oHeight);
      const verMaterial: MeshStandardMaterial = this.terrainService.getMaterial(this.dreamMap.land.type, false, this.renderer);
      verMaterial.map.repeat.set(oWidth + (oSize * 2), oSize);
      [horMaterial, verMaterial].forEach(m => {
        m.map.wrapS = RepeatWrapping;
        m.map.wrapT = RepeatWrapping;
        m.side = FrontSide;
      });
      // Геометрии
      const horGeometries: PlaneGeometry = new PlaneGeometry(size, height);
      const verGeometries: PlaneGeometry = new PlaneGeometry(width + (size * 2), size);
      // Объекты
      const leftMesh: Mesh = new Mesh(horGeometries, horMaterial);
      const rightMesh: Mesh = new Mesh().copy(leftMesh);
      const topMesh: Mesh = new Mesh(verGeometries, verMaterial);
      const bottomMesh: Mesh = new Mesh().copy(topMesh);
      const meshes: Mesh[] = [leftMesh, rightMesh, topMesh, bottomMesh];
      // Свойства
      meshes.forEach(m => {
        m.rotateX(AngleToRad(-90));
        m.receiveShadow = true;
      });
      leftMesh.position.set(-posX - posCorr, z, -posCorr);
      rightMesh.position.set(posX - posCorr, z, -posCorr);
      topMesh.position.set(-posCorr, z, -posY - posCorr);
      bottomMesh.position.set(-posCorr, z, posY - posCorr);
      // Добавить в кэш
      this.borderMeshes = meshes;
      // Добавить на сцену
      this.scene.add(...meshes);
      // Рендер
      this.render();
    }
  }

  // Отрисовать океан
  private createOcean(): void {
    if (this.scene) {
      const width: number = this.dreamMap?.size?.width || DreamMapSize;
      const height: number = this.dreamMap?.size?.height || DreamMapSize;
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      const z: number = (heightPart * this.dreamMap.ocean.z) - (heightPart * this.maxCeilHeight) - heightPart;
      const geometry: PlaneGeometry = new PlaneGeometry(
        (this.ceilSize * (width + 2)) * 3,
        (this.ceilSize * (height + 2)) * 3
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
      this.ocean.material.uniforms.size.value = this.ceilSize * 10;
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
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      // Анимация
      requestAnimationFrame(this.animate.bind(this));
      // Обновить воду
      this.ocean.material.uniforms.time.value += heightPart / 1.5;
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
  setTerrainHoverStatus(ceil: DreamMapCeil): void {
    // Объект найден
    if (ceil) {
      const findData = ({ ceil: { coord: { x, y } } }: MeshUserData) => ceil.coord.x === x && ceil.coord.y === y;
      const mesh: Mesh = this.terrainMeshes.find(e => findData(e.userData as MeshUserData));
      // Для подсветки ячеек
      if (mesh) {
        const material: MeshPhongMaterial = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as MeshPhongMaterial;
        const color: number = material.emissive.getHex();
        // Надо сменить подсветку с земли
        if ((ceil.highlight && color !== this.successHighlight) || (!ceil.highlight && color === this.successHighlight)) {
          material.setValues({ emissive: ceil.highlight ? this.successHighlight : 0x000000 });
        }
      }
    }
  }

  // Обновить высоту местности
  setTerrainHeight(ceil: DreamMapCeil): void {
    let mesh: Mesh = ceil ? this.terrainMeshes.find(e =>
      (e.userData as MeshUserData).ceil.coord.x === ceil.coord.x &&
      (e.userData as MeshUserData).ceil.coord.y === ceil.coord.y
    ) : null;
    // Объект найден
    if (ceil && mesh) {
      mesh.geometry.dispose();
      // Новая геометрия
      const heightPart: number = this.ceilSize / this.ceilHeightParts;
      const geometry: BufferGeometry = this.terrainService.getGeometry(
        this.ceilSize,
        heightPart * ceil.coord.z,
        this.getClosestHeights(ceil)
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
  setTerrain(ceil: DreamMapCeil, isLastCeils: boolean = false): void {
    const mesh: Mesh = this.terrainMeshes.find(e =>
      (e.userData as MeshUserData).ceil.coord.x === ceil.coord.x &&
      (e.userData as MeshUserData).ceil.coord.y === ceil.coord.y
    );
    // Объект найден
    if (ceil && mesh) {
      const oldMaterial: MeshStandardMaterial = mesh.material as MeshStandardMaterial;
      const material: MeshStandardMaterial = this.terrainService.getMaterial(ceil.terrain, true, this.renderer);
      // Дополнить материал
      mesh.material = material;
      material.setValues({ emissive: ceil.highlight ? this.successHighlight : 0x000000 });
      // Очистить старую геометрию
      oldMaterial.dispose();
      // Перерисовать миникарту
      this.drawMiniMap(ceil.coord.x, ceil.coord.y, isLastCeils);
    }
  }

  // Обновить текстуру местности
  setTerrainSettings(terrainId: number): void {
    const meshes: Mesh[] = this.terrainMeshes.filter(e => (e.userData as MeshUserData).ceil.terrain === terrainId);
    const terrain: MapTerrain = this.terrainService.getTerrain(terrainId);
    const material: MeshStandardMaterial = this.terrainService.getMaterial(terrainId, true, this.renderer);
    // Настройки материала
    material.setValues({
      emissive: 0x000000,
      metalness: terrain.settings.metalness,
      roughness: terrain.settings.roughness,
      aoMapIntensity: terrain.settings.aoMapIntensity,
      displacementScale: terrain.settings.displacementScale,
      envMapIntensity: terrain.settings.envMapIntensity
    });
    material.normalScale.set(1, - 1).multiplyScalar(terrain.settings.normalScale);
    material.color.setRGB(
      terrain.settings.colorR / 255,
      terrain.settings.colorG / 255,
      terrain.settings.colorB / 255
    );
    // Найдены ячейки
    if (!!meshes?.length) {
      meshes.forEach(mesh => {
        const oldMaterial: MeshStandardMaterial = mesh.material as MeshStandardMaterial;
        // Дополнить материал
        (mesh.material as Material).copy(material);
        // Очистить старую геометрию
        oldMaterial.dispose();
      });
    }
  }

  // Обновить уровень мирового океана
  setOceanHeight(oceanHeight: number): void {
    this.dreamMap.ocean.z = oceanHeight;
    // Параметры
    const heightPart: number = this.ceilSize / this.ceilHeightParts;
    const z: number = (heightPart * this.dreamMap.ocean.z) - (heightPart * this.maxCeilHeight) - heightPart;
    // Свойства
    this.ocean.position.setY(z);
  }

  // Обновить уровень окружающего ландшафта
  setLandHeight(landHeight: number): void {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    const ceils: DreamMapCeil[] = this.terrainMeshes.map(r => r.userData as MeshUserData).map(d => d.ceil);
    const borderCeils: DreamMapCeil[] = ceils
      .filter(({ coord: { x, y } }) => this.isBorder(x, y))
      .map(ceil => ({ ...ceil, coord: { ...ceil.coord, z: landHeight } }));
    const closestHeights: DreamMapCeil[] = ceils
      .filter(({ coord: { x, y } }) => (x === 0 || y === 0 || x === width - 1 || y === height - 1) && !this.isBorder(x, y));
    const heightPart: number = this.ceilSize / this.ceilHeightParts;
    const z: number = (heightPart * landHeight) - (heightPart * this.maxCeilHeight);
    // Обновить параметры
    this.dreamMap.land.z = landHeight;
    // Обновить высоты
    [...borderCeils, ...closestHeights].forEach(ceil => this.setTerrainHeight(ceil));
    this.borderMeshes.forEach(b => b.position.setY(z));
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
