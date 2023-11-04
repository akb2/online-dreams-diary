import { DreamCameraMaxZoom, DreamCameraMinZoom, DreamCeilSize, DreamMapSize } from "@_datas/dream-map-settings";
import { AngleToRad, LineFunc, ParseInt, RadToAngle } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { CanvasContextType } from "@_models/app";
import { DreamMap } from "@_models/dream-map";
import { ScreenService } from "@_services/screen.service";
import { FogFar } from "@_services/three.js/skybox.service";
import { Injectable, OnDestroy } from "@angular/core";
import { viewer3DSetCompassAction } from "@app/reducers/viewer-3d";
import { Octree, OctreeRaycaster } from "@brakebein/threeoctree";
import { Store } from "@ngrx/store";
import { BlendMode, CircleOfConfusionMaterial, DepthOfFieldEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { Observable, Subject, animationFrames, concatMap, fromEvent, takeUntil } from "rxjs";
import { CineonToneMapping, Clock, Intersection, MOUSE, Mesh, PCFSoftShadowMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer, sRGBEncoding } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";





@Injectable()

export class Engine3DService implements OnDestroy {

  private contextType: CanvasContextType = "webgl";
  private sceneColor: number = 0x000000;
  private drawShadows: boolean = true;
  private rotateSpeed: number = 1.4;
  private moveSpeed: number = DreamCeilSize * 14;
  private zoomSpeed: number = DreamCeilSize;
  private minAngle: number = 0;
  private maxAngle: number = 85;

  dreamMap: DreamMap;

  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  private canvas: HTMLCanvasElement;
  private helper: HTMLElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private control: OrbitControls;
  private octree: Octree;
  private clock: Clock;
  private postProcessingEffects: PostProcessingEffects;
  private composer: EffectComposer;

  renderEvent$: Observable<AnimationFramesEvent> = animationFrames();
  private destroyed$: Subject<void> = new Subject();





  // Получить объекты пересечения
  private getIntercectionObject(x: number, y: number): Intersection[] {
    x = (x / this.canvasWidth) * 2 - 1;
    y = -((y / this.canvasHeight) * 2 - 1);
    const far: number = FogFar * DreamCeilSize;
    const raycaster: OctreeRaycaster = new OctreeRaycaster(new Vector3(), new Vector3(), 0, far);
    // Настройки
    raycaster.setFromCamera({ x, y }, this.camera);
    // Объекты в фокусе
    const intersect: Intersection[] = raycaster.intersectOctreeObjects(this.octree.search(raycaster.ray.origin, far, true, raycaster.ray.direction));
    // Обработка объектов
    return intersect?.length ? intersect : null;
  }





  constructor(
    private screenService: ScreenService,
    private store$: Store
  ) {
    this.onCanvasResize();
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
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.toneMapping = CineonToneMapping;
  }

  // Создание сцены
  private createScene(): void {
    this.scene = new Scene();
  }

  // Создание камеры
  private createCamera(): void {
    this.camera = new PerspectiveCamera(
      30,
      this.canvasWidth / this.canvasHeight,
      DreamCeilSize / 10,
      FogFar * DreamCeilSize
    );
    this.camera.position.setX(this.dreamMap.camera.position.x);
    this.camera.position.setY(this.dreamMap.camera.position.y);
    this.camera.position.setZ(this.dreamMap.camera.position.z);
    this.camera.far = FogFar * DreamCeilSize;
    // Добавить камеру
    this.scene.add(this.camera);
  }

  // Создание пересечений
  private createOctree(): void {
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const raycastSize: number = (mapWidth * mapHeight) + 3;
    const depthMax: number = 1;
    const preferredObjectsPerNode: number = 8;
    const objectsThreshold: number = ParseInt(Math.ceil(raycastSize / Math.pow(2, depthMax)), preferredObjectsPerNode);
    // Настройка пересечений
    this.octree = new Octree({
      // scene: this.scene,
      undeferred: false,
      depthMax: 1,
      objectsThreshold,
      overlapPct: 0.15
    });
  }

  // Создание управления камерой
  private createControl(): void {
    this.control = new OrbitControls(this.camera, this.canvas);
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
    // Изменение камеры
    fromEvent(this.control, "change")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(event => this.onCameraChange(event.target));
  }

  // Создание постпроцессоров
  private createPostProcessors(): void {
    const renderPass: RenderPass = new RenderPass(this.scene, this.camera);
    const depthOfFieldEffect: DepthOfFieldEffect = new DepthOfFieldEffect(this.camera, {
      focalLength: 0.1,
      focusRange: 0.3,
      bokehScale: 5,
      resolutionX: this.canvasWidth,
      resolutionY: this.canvasHeight
    });
    const effectPass: EffectPass = new EffectPass(this.camera, depthOfFieldEffect);
    // Добавление эффектов
    this.postProcessingEffects = { renderPass, depthOfFieldEffect };
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(effectPass);
  }

  // Запуск анимации
  private createAnimation(): void {
    this.renderEvent$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.control.update();
        this.composer.render();
      });
  }





  // Добавить объект на сцену
  addToScene(...objects: Mesh[]): void {
    this.scene.add(...objects);
  }





  // Изменение размера canvas
  private onCanvasResize(): void {
    WaitObservable(() => !this.helper)
      .pipe(
        concatMap(() => this.screenService.elmResize(this.helper)),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => {
        this.createCanvas();
        // Настройки
        if (this.renderer) {
          this.renderer.setSize(this.canvasWidth, this.canvasHeight);
          this.camera.aspect = this.canvasWidth / this.canvasHeight;
          // обновить пост отрисовку
          this.onUpdatePostProcessors();
          // Рендер
          this.camera.updateProjectionMatrix();
          this.composer.render();
        }
      });
  }

  // Изменение позиции камеры
  private onCameraChange(event: OrbitControls): void {
    const width: number = this.dreamMap?.size?.width || DreamMapSize;
    const height: number = this.dreamMap?.size?.height || DreamMapSize;
    const vector: Vector3 = new Vector3();
    // Настройка позиции камеры
    this.control.panSpeed = this.moveSpeed / event.getDistance();
    // Параметры
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
    this.store$.dispatch(viewer3DSetCompassAction({
      radial: RadToAngle(Math.atan2(-vector.x, -vector.z)),
      azimuth: 0
    }))
    // обновить пост отрисовку
    this.onUpdatePostProcessors();
  }

  // Обновить параметры пост обработки
  private onUpdatePostProcessors(): void {
    if (!!this.postProcessingEffects) {
      const chairPositionX: number = this.canvasWidth * 0.5;
      const chairPositionY: number = LineFunc(
        this.canvasHeight * 0.9,
        this.canvasHeight * 0.5,
        this.control.getPolarAngle(),
        this.control.minPolarAngle,
        this.control.maxPolarAngle
      );
      const objects: Intersection[] = this.getIntercectionObject(chairPositionX, chairPositionY);
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
      depthOfFieldEffect.resolution.width = this.canvasWidth;
      depthOfFieldEffect.resolution.height = this.canvasHeight;
      // Найдены объекты
      depthOfFieldEffect.target = !!closestObject ? closestObject.point : this.control.target;
      circleOfConfusionMaterial.uniforms.focalLength.value = focusDistance;
      circleOfConfusionMaterial.uniforms.focusRange.value = focusDistance * 0.5;
    }
  }
}





// Интерфейс эффектов постобработки
interface PostProcessingEffects {
  renderPass: RenderPass;
  depthOfFieldEffect: DepthOfFieldEffect;
}

// Интерфейс данных анимации
interface AnimationFramesEvent {
  timestamp: number;
  elapsed: number;
}
