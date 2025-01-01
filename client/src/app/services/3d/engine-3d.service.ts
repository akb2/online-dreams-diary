import { DreamCameraMaxZoom, DreamCameraMinZoom, DreamCeilSize, DreamFogFar, DreamMapSize } from "@_datas/dream-map-settings";
import { AngleByLegs, AngleToRad, CheckInRange, DetectDirectionByExpressions, LineFunc, ParseFloat, ParseInt, RadToAngle } from "@_helpers/math";
import { ArrayFilter, ArrayForEach } from "@_helpers/objects";
import { WaitObservable } from "@_helpers/rxjs";
import { CanvasContextType } from "@_models/app";
import { DreamMap, DreamMapCameraPosition } from "@_models/dream-map";
import { AnimationData } from "@_models/three.js/base";
import { DreamService } from "@_services/dream.service";
import { ScreenService } from "@_services/screen.service";
import { Injectable, OnDestroy } from "@angular/core";
import { viewer3DSetCompassAction } from "@app/reducers/viewer-3d";
import { Octree, OctreeRaycaster } from "@brakebein/threeoctree";
import { Store } from "@ngrx/store";
import { BlendFunction, BloomEffect, DepthOfFieldEffect, EffectComposer, EffectPass, KernelSize, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { Subject, animationFrames, delay, filter, fromEvent, retry, switchMap, takeUntil, tap } from "rxjs";
import { Clock, Fog, Intersection, LinearSRGBColorSpace, MOUSE, Mesh, NoToneMapping, PCFSoftShadowMap, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { Ceil3dService } from "./ceil-3d.service";



@Injectable()
export class Engine3DService implements OnDestroy {

  private readonly contextType: CanvasContextType = "webgl2";
  private readonly sceneColor = 0x000000;
  private readonly drawShadows = true;
  private readonly rotateSpeed = 1.4;
  private readonly moveSpeed = DreamCeilSize * 14;
  private readonly zoomSpeed = 1;
  private readonly minAngle = 0;
  private readonly maxAngle = 80;

  dreamMap: DreamMap;
  scene: Scene;
  renderer: WebGLRenderer;
  control: OrbitControls;
  stats: Stats;
  camera: PerspectiveCamera;
  octree: Octree;
  intersectionList: Mesh[] = [];
  clock = new Clock();

  canvasWidth = 0;
  canvasHeight = 0;
  private cameraFirstChange = true;

  private canvas: HTMLCanvasElement;
  private helper: HTMLElement;
  private postProcessingEffects: PostProcessingEffects;
  private composer: EffectComposer;
  private animationList: AnimationCallback[] = [];
  private rayCaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, DreamFogFar)
  private rayCasterCoords = new Vector2();

  private lastCamera: PerspectiveCamera;

  private destroyed$: Subject<void> = new Subject();



  /**
   * Получить объекты пересечения
   * @param {number} screenX координата по оси X на экране канваса
   * @param {number} screenY координата по оси Y на экране канваса
   * @returns {Intersection[]} список объектов с которыми произошло пересечение в порядке возрастания дистанции
   */
  getIntercectionObject(screenX: number, screenY: number): Intersection[] {
    const x = ((screenX / this.canvasWidth) * 2) - 1;
    const y = -(((screenY / this.canvasHeight) * 2) - 1);
    // Настройки
    this.rayCasterCoords.set(x, y);
    this.rayCaster.setFromCamera(this.rayCasterCoords, this.camera);
    // Объекты в фокусе
    const intersect: Intersection[] = this.rayCaster.intersectObjects(this.intersectionList, false);
    // Обработка объектов
    return !!intersect?.length
      ? intersect.sort(({ distance: a }, { distance: b }) => DetectDirectionByExpressions(a < b, a > b))
      : [];
  }

  get defaultControlPosition(): DreamMapCameraPosition {
    const width = ParseInt(this.dreamMap?.size?.width, DreamMapSize);
    const height = ParseInt(this.dreamMap?.size?.height, DreamMapSize);
    // Параметры камеры по умолчанию
    return this.dreamService.getDefaultCamera(width, height);
  }



  constructor(
    private dreamService: DreamService,
    private screenService: ScreenService,
    private ceil3dService: Ceil3dService,
    private store$: Store
  ) {
    this.canvasResizeListener();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }



  // Подготовка окружения
  create(canvas: HTMLCanvasElement, helper: HTMLElement): void {
    this.canvas = canvas;
    this.helper = helper;
    // Функции создания
    this.createCanvas();
    this.createRenderer();
    this.createScene();
    this.createCamera();
    this.createOctree();
    this.createControl();
    this.createPostProcessors();
    this.createStats();
    this.createAnimation();
    // Первые события
    this.onUpdatePostProcessors();
  }

  // Создание canvas
  private createCanvas(): void {
    this.canvasWidth = this.helper.getBoundingClientRect().width || 0;
    this.canvasHeight = this.helper.getBoundingClientRect().height || 0;
  }

  // Создание отрисовщика
  private createRenderer(): void {
    this.renderer = new WebGLRenderer({
      context: this.canvas.getContext(this.contextType) as WebGLRenderingContext,
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      precision: "highp",
      powerPreference: "high-performance",
      logarithmicDepthBuffer: false
    });
    this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    this.renderer.setClearColor(this.sceneColor, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = this.drawShadows;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = LinearSRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
  }

  // Создание сцены
  private createScene(): void {
    this.scene = new Scene();
  }

  // Создание камеры
  private createCamera(): void {
    const { position } = this.defaultControlPosition;
    // Создание камеры
    this.camera = new PerspectiveCamera(30, this.canvasWidth / this.canvasHeight, DreamCeilSize / 10, DreamFogFar);
    this.camera.position.setX(ParseFloat(this.dreamMap?.camera?.position?.x, position.x, 16));
    this.camera.position.setY(ParseFloat(this.dreamMap?.camera?.position?.y, position.y, 16));
    this.camera.position.setZ(ParseFloat(this.dreamMap?.camera?.position?.z, position.z, 16));
    // Добавить камеру
    this.scene.add(this.camera);
  }

  // Создание пересечений
  private createOctree(): void {
    const mapWidth = this.dreamMap.size.width * DreamCeilSize; // 50
    const mapHeight = this.dreamMap.size.height * DreamCeilSize; // 50
    const raycastSize = (mapWidth * mapHeight) + 3;
    const depthMax = 10;
    const preferredObjectsPerNode = 8;
    const objectsThreshold = ParseInt(Math.ceil(raycastSize / Math.pow(2, depthMax)), preferredObjectsPerNode);
    // Настройка пересечений
    this.octree = new Octree({
      // scene: this.scene,
      undeferred: true,
      depthMax: 1,
      objectsThreshold,
      overlapPct: 0.15
    });
  }

  // Создание управления камерой
  private createControl(): void {
    const { target } = this.defaultControlPosition;
    // Создание Управления
    this.control = new OrbitControls(this.camera, this.canvas);
    this.control.screenSpacePanning = false;
    this.control.enablePan = true;
    this.control.rotateSpeed = this.rotateSpeed;
    this.control.panSpeed = this.moveSpeed;
    this.control.zoomSpeed = this.zoomSpeed;
    this.control.minDistance = DreamCameraMinZoom;
    this.control.maxDistance = DreamCameraMaxZoom;
    this.control.minPolarAngle = AngleToRad(this.minAngle);
    this.control.maxPolarAngle = AngleToRad(this.maxAngle);
    this.control.mouseButtons = { LEFT: null, MIDDLE: MOUSE.LEFT, RIGHT: MOUSE.RIGHT };
    this.control.target.setX(ParseFloat(this.dreamMap?.camera?.target?.x, target.x, 16));
    this.control.target.setY(ParseFloat(this.dreamMap?.camera?.target?.y, target.y, 16));
    this.control.target.setZ(ParseFloat(this.dreamMap?.camera?.target?.z, target.z, 16));
    this.camera.far = DreamFogFar;
    // Изменение камеры
    fromEvent(this.control, "change")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(event => this.onCameraChange(event.target));
  }

  // Создание постпроцессоров
  private createPostProcessors(): void {
    const bloomEffect = new BloomEffect({
      blendFunction: BlendFunction.SCREEN,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.05,
      mipmapBlur: true,
      intensity: 0.9,
      radius: 0.8,
      levels: 5,
      kernelSize: KernelSize.LARGE,
      resolutionX: this.canvasWidth,
      resolutionY: this.canvasHeight
    });
    const depthOfFieldEffect: DepthOfFieldEffect = new DepthOfFieldEffect(this.camera, {
      focalLength: 0.1,
      focusRange: 0.3,
      bokehScale: 5,
      resolutionX: this.canvasWidth,
      resolutionY: this.canvasHeight
    });
    const toneMappingEffect: ToneMappingEffect = new ToneMappingEffect({
      blendFunction: BlendFunction.SRC,
      mode: ToneMappingMode.ACES_FILMIC,
      resolution: 256,
      maxLuminance: 4.0,
      whitePoint: 4.0,
      middleGrey: 0.6,
      minLuminance: 0.01,
      averageLuminance: 1.0,
      adaptationRate: 1.0
    });
    // Проводники
    const renderPass: RenderPass = new RenderPass(this.scene, this.camera);
    const effectPass: EffectPass = new EffectPass(this.camera, depthOfFieldEffect, bloomEffect, toneMappingEffect);
    // Добавление эффектов
    this.postProcessingEffects = { depthOfFieldEffect, bloomEffect, toneMappingEffect };
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(effectPass);
  }

  // Запуск анимации
  private createAnimation(): void {
    animationFrames()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.onAnimate();
        // Обновление
        this.control.update();
        this.composer.render();
        this.stats.update();
      });
  }

  // Создание статистики
  private createStats(): void {
    this.stats = new Stats();
  }



  // Добавить объект на сцену
  addToScene(...objects: Mesh[]): void {
    ArrayForEach(
      ArrayFilter(objects, object => !!object),
      object => this.scene.add(object)
    );
  }

  // Добавить объект на сцену
  addToAnimation(...animations: AnimationCallback[]): void {
    ArrayForEach(
      ArrayFilter(animations, animation => !!animation && !this.animationList.includes(animation)),
      animation => this.animationList.push(animation)
    );
  }

  // Добавить в пересечения курсора
  addToIntersection(...objects: Mesh[]): void {
    ArrayForEach(
      ArrayFilter(objects, object => !!object && !this.intersectionList.includes(object)),
      object => {
        this.octree.add(object);
        this.intersectionList.push(object);
      }
    );
    // Обновить
    this.octree.update();
  }

  // Установить туман
  setFog(fog: Fog): void {
    this.scene.fog = fog;
  }



  // Изменение позиции камеры
  onCameraChange(event: OrbitControls): void {
    const width = this.dreamMap.size.width * DreamCeilSize;
    const height = this.dreamMap.size.height * DreamCeilSize;
    const vector: Vector3 = new Vector3();
    // Настройка позиции камеры
    this.control.panSpeed = this.moveSpeed / event.getDistance();
    // Параметры
    let x = event.target.x;
    let z = event.target.z;
    const mapX = width / 2;
    const mapZ = height / 2;
    const xLimited = x > mapX || x < -mapX;
    const zLimited = z > mapZ || z < -mapZ;
    // Ограничить положение камеры X
    if (xLimited || zLimited) {
      const cameraX = xLimited
        ? this.lastCamera.position.x
        : event.object.position.x;
      const cameraZ = zLimited
        ? this.lastCamera.position.z
        : event.object.position.z;
      // Новые позмции
      x = CheckInRange(x, mapX, -mapX);
      z = CheckInRange(z, mapZ, -mapZ);
      // Установить позицию
      event.target.setX(x);
      event.target.setZ(z);
      event.object.position.setZ(cameraZ);
      event.object.position.setX(cameraX);
      event.object.position.setY(this.lastCamera.position.y);
      event.object.rotation.copy(this.lastCamera.rotation);
    }
    // Запомнить положение камеры
    this.lastCamera = event.object.clone() as PerspectiveCamera;
    this.camera.far = DreamFogFar;
    this.dreamMap.isChanged = this.cameraFirstChange
      ? !!this.dreamMap.isChanged
      : true;
    this.cameraFirstChange = false;
    // Угол для компаса
    event.object.getWorldDirection(vector);
    // Положение на компасе
    const circlePos = this.ceil3dService.coordsToUV(x, z);
    // Запомнить угол для компаса
    this.store$.dispatch(viewer3DSetCompassAction({
      radial: AngleByLegs(-vector.x, -vector.z),
      azimuth: RadToAngle(vector.y * (Math.PI / 2)),
      sin: circlePos.v,
      cos: circlePos.u
    }))
    // обновить пост отрисовку
    this.onUpdatePostProcessors();
  }

  // Обновить параметры пост обработки
  onUpdatePostProcessors(): void {
    if (!!this.postProcessingEffects) {
      const chairPositionX = this.canvasWidth * 0.5;
      const chairPositionY = this.canvasHeight * 0.5;
      const intersects = this.getIntercectionObject(chairPositionX, chairPositionY);
      const closestObject = intersects[intersects.length - 1];
      const { depthOfFieldEffect, bloomEffect } = this.postProcessingEffects;
      const circleOfConfusionMaterial = depthOfFieldEffect.circleOfConfusionMaterial;
      const blendMode = depthOfFieldEffect.blendMode;
      const distance = this.control.getDistance();
      const focusDistance = LineFunc(0.4, 0.5, distance, 0, this.control.maxDistance);
      // Обновить дальность
      blendMode.opacity.value = LineFunc(1, 0.6, distance, this.control.minDistance, this.control.maxDistance);
      depthOfFieldEffect.resolution.width = this.canvasWidth;
      depthOfFieldEffect.resolution.height = this.canvasHeight;
      // Обновить свечение
      bloomEffect.resolution.width = this.canvasWidth;
      bloomEffect.resolution.height = this.canvasHeight;
      // Найдены объекты
      depthOfFieldEffect.target = !!closestObject
        ? closestObject.point
        : this.control.target;
      circleOfConfusionMaterial.uniforms.focalLength.value = focusDistance;
      circleOfConfusionMaterial.uniforms.focusRange.value = focusDistance * 0.5;
    }
  }

  // Анимация
  private onAnimate(): void {
    ArrayForEach(ArrayFilter(this.animationList, animation => !!animation), animation => animation({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      control: this.control
    }));
  }



  // Изменение размера canvas
  private canvasResizeListener(): void {
    WaitObservable(() => !this.helper)
      .pipe(
        switchMap(() => this.screenService.elmResize(this.helper).pipe(
          retry()
        )),
        tap(() => this.createCanvas()),
        filter(() => !!this.renderer),
        tap(() => {
          this.renderer.setSize(this.canvasWidth, this.canvasHeight);
          this.renderer.setPixelRatio(window.devicePixelRatio);
          this.composer.setSize(this.canvasWidth, this.canvasHeight);
          this.camera.aspect = this.canvasWidth / this.canvasHeight;
        }),
        tap(() => {
          this.camera.updateProjectionMatrix();
          this.composer.render();
        }),
        delay(1),
        tap(() => this.onCameraChange(this.control)),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => {
      });
  }
}



// Тип функции для анимации
type AnimationCallback = (data: AnimationData) => void;

// Интерфейс эффектов постобработки
interface PostProcessingEffects {
  bloomEffect: BloomEffect;
  toneMappingEffect: ToneMappingEffect;
  depthOfFieldEffect: DepthOfFieldEffect;
}

// Интерфейс данных анимации
interface AnimationFramesEvent {
  timestamp: number;
  elapsed: number;
}
