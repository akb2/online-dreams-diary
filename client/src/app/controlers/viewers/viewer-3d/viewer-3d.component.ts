import { CompareElementByElement, VoidFunctionVar } from "@_datas/app";
import { ClosestHeightNames } from "@_datas/dream-map";
import { Load3DTexture } from "@_datas/three.js/core/texture";
import { AverageSumm, ParseInt } from "@_helpers/math";
import { ArrayFilter, ArrayMap, GetCoordsByIndex } from "@_helpers/objects";
import { ConsistentResponses, TakeCycle, WaitObservable } from "@_helpers/rxjs";
import { CustomObjectKey, DefaultKey } from "@_models/app";
import { ClosestHeightName, DreamMap, DreamMapCeil, ReliefType } from "@_models/dream-map";
import { LoadTexture } from "@_models/three.js/base";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { Cursor3DService } from "@_services/3d/cursor-3d.service";
import { Engine3DService } from "@_services/3d/engine-3d.service";
import { Landscape3DService } from "@_services/3d/landscape-3d.service";
import { Settings3DService } from "@_services/3d/settings-3d.service";
import { Sky3DService } from "@_services/3d/sky-3d.service";
import { WorldOcean3DService } from "@_services/3d/world-ocean-3d.service";
import { ScreenService } from "@_services/screen.service";
import { clamp, floor, round } from "@akb2/math";
import { anyToFloat } from "@akb2/types-tools";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { editor3DHoverCeilCoordsSelector, editor3DHoverInWorkAreaSelector, editor3DHoveringCeil, editor3DShowControlsSelector, editor3DSkyTimeSelector, editor3DWorldOceanHeightSelector, viewer3DInitialLoaderDisableAction, viewer3DInitialLoaderEnableAction, viewer3DInitialLoaderSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { Observable, Subject, animationFrameScheduler, catchError, concatMap, delay, fromEvent, map, merge, observeOn, of, skipWhile, switchMap, takeUntil, tap, throwError, timer } from "rxjs";

@Component({
  selector: "viewer-3d",
  templateUrl: "./viewer-3d.component.html",
  styleUrls: ["viewer-3d.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Viewer3DComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() dreamMap: DreamMap;
  @Input() debugInfo = true;
  @Input() showCompass = true;
  @Input() showCursor = false;

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("helper") private helper: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  loadingStep: LoadingStep = LoadingStep.prepared;

  private readonly loadCeilsByTime = 350;
  private readonly calcOperationLoadingSize = 500;
  private readonly calcOperationLoadingDelay = 80;
  private readonly texturesLoadingSize = 1000;

  private loadingCeilLimit = 0;
  private loadingCeilCurrent: CustomObjectKey<LoadingStep, number> = {};

  private textures: LoadTexture[] = [];
  private ceilsOperations: CalcFunction<DreamMapCeil>[] = [];
  private calcOperations: CalcFunction[] = [];

  loading$ = this.store$.select(viewer3DInitialLoaderSelector);
  showControls$ = this.store$.select(editor3DShowControlsSelector);
  cursorInWorkArea$ = this.store$.select(editor3DHoverInWorkAreaSelector);
  cursorCoords$ = this.store$.select(editor3DHoverCeilCoordsSelector);

  private skyTime$ = this.store$.select(editor3DSkyTimeSelector);
  private worldOceanHeight$ = this.store$.select(editor3DWorldOceanHeightSelector);

  private destroyed$: Subject<void> = new Subject();



  // Состояние лоадера
  get progressBarState(): ProgressState {
    const withProgress = LoaderProgressSteps.includes(this.loadingStep);
    const mode: ProgressBarMode = withProgress ? "determinate" : "indeterminate";
    const icon = LoaderIcons?.[this.loadingStep] ?? LoaderIcons[DefaultKey];
    const ceilsCycles = ParseInt(this.ceilsOperations?.length);
    const ceilsProgress = ParseInt(AverageSumm(Object.values(this.loadingCeilCurrent)));
    let subSteps: number = 0;
    let completedSubSteps: number = 0;
    // Функции просчета сцены
    const allCalcSize: number = this.calcOperations.length * this.calcOperationLoadingSize;
    const completedCalcSize: number = this.calcOperations.filter(d => !!d?.called).length * this.calcOperationLoadingSize;
    // Текстуры
    const allTexturesSize: number = ParseInt(AverageSumm(this.textures.map(({ size }) => size)) / this.texturesLoadingSize);
    const loadedTexturesSize: number = ParseInt(AverageSumm(this.textures.map(({ loadedSize }) => loadedSize)) / this.texturesLoadingSize);
    // Прогресс
    const maxOperations: number = (this.loadingCeilLimit * ceilsCycles) + allCalcSize + allTexturesSize;
    const currentOperation: number = 1 + ceilsProgress + completedCalcSize + loadedTexturesSize;
    const progress: number = withProgress && maxOperations > 0
      ? round((currentOperation / maxOperations) * 100, 3)
      : 0;
    // Подшаги для ячеек
    if (LoaderCeilsSteps.includes(this.loadingStep)) {
      subSteps = this.loadingCeilLimit;
      completedSubSteps = this.loadingCeilCurrent[this.loadingStep];
    }
    // Подшаги для текстур
    else if (this.loadingStep === LoadingStep.loadTextures) {
      subSteps = this.textures.length;
      completedSubSteps = this.textures.filter(({ loaded }) => loaded).length;
    }
    // Подшаги для функций
    else if (this.loadingStep === LoadingStep.calcMethods) {
      subSteps = this.calcOperations.length;
      completedSubSteps = this.calcOperations.filter(d => !!d?.called).length;
    }
    // Вернуть состояние
    return { mode, icon, progress, subSteps, completedSubSteps };
  }

  // Проверка сенсорного экрана
  private get isTouchDevice(): boolean {
    return "ontouchstart" in window || !!navigator?.maxTouchPoints;
  }

  // Данные карты
  get getMap(): DreamMap {
    const control = this.engine3DService.control;
    const camera = this.engine3DService.camera;
    const { position, target } = this.engine3DService.defaultControlPosition;
    const ceils = this.dreamMap?.ceils.filter(c =>
      (!!c.terrain && c.terrain > 0 && c.terrain !== this.settings3DService.terrain)
      || (!!c.coord.originalZ && c.coord.originalZ > 0 && c.coord.originalZ !== this.settings3DService.height)
    );
    // Вернуть карту
    return {
      ceils,
      camera: {
        target: {
          x: anyToFloat(control?.target?.x, target.x, 16),
          y: anyToFloat(control?.target?.y, target.y, 16),
          z: anyToFloat(control?.target?.z, target.z, 16)
        },
        position: {
          x: anyToFloat(camera?.position?.x, position.x, 16),
          y: anyToFloat(camera?.position?.y, position.y, 16),
          z: anyToFloat(camera?.position?.z, position.z, 16)
        }
      },
      dreamerWay: [],
      size: this.dreamMap?.size,
      ocean: {
        material: ParseInt(this.dreamMap?.ocean?.material, 1),
        z: ParseInt(this.dreamMap?.ocean?.z, this.settings3DService.waterDefaultHeight)
      },
      land: {
        type: ParseInt(this.dreamMap?.land?.type, this.settings3DService.terrain),
        z: ParseInt(this.dreamMap?.land?.z, this.settings3DService.height)
      },
      sky: {
        time: ParseInt(this.dreamMap?.sky?.time, this.settings3DService.skyTime)
      },
      relief: {
        types: ClosestHeightNames.reduce((o, name) => ({
          ...o,
          [name as ClosestHeightName]: this.dreamMap?.relief?.types?.hasOwnProperty(name)
            ? this.dreamMap?.relief.types[name]
            : ReliefType.flat
        }), {})
      },
      isNew: false,
      noiseSeed: 0,
      noise: null,
      isChanged: !!this.dreamMap?.isChanged
    };
  }



  constructor(
    private ceil3dService: Ceil3dService,
    private engine3DService: Engine3DService,
    private landscape3DService: Landscape3DService,
    private sky3DService: Sky3DService,
    private worldOcean3DService: WorldOcean3DService,
    private cursor3DService: Cursor3DService,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private settings3DService: Settings3DService,
    private store$: Store
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.dreamMap) {
      this.settings3DService.setMapSize(
        this.dreamMap?.size?.width,
        this.dreamMap?.size?.height,
        this.dreamMap?.size?.zHeight
      );
      // Обновить карту в сервисах
      this.ceil3dService.dreamMap = this.dreamMap;
      this.engine3DService.dreamMap = this.dreamMap;
      this.landscape3DService.dreamMap = this.dreamMap;
      this.sky3DService.dreamMap = this.dreamMap;
      this.worldOcean3DService.dreamMap = this.dreamMap;
      this.cursor3DService.dreamMap = this.dreamMap;
    }
  }

  ngAfterViewInit(): void {
    if (!!window.WebGLRenderingContext) {
      this.store$.dispatch(viewer3DInitialLoaderEnableAction());
      // Цикл загрузок
      WaitObservable(() => !this.canvas?.nativeElement || !this.helper?.nativeElement || !this.dreamMap)
        .pipe(
          tap(() => this.settings3DService.setMapSize(
            this.dreamMap.size.width,
            this.dreamMap.size.height,
            this.dreamMap.size.zHeight
          )),
          switchMap(() => this.loadScene()),
          switchMap(() => this.getTexturesData()),
          switchMap(() => this.loadTextures()),
          switchMap(() => this.createLandScapeCycle()),
          switchMap(() => this.callCalcMethods()),
          switchMap(() => this.onViewerLoad()),
          tap(() => this.store$.dispatch(viewer3DInitialLoaderDisableAction())),
          switchMap(() => this.createStats()),
          switchMap(() => this.dreamMapChangesListeners()),
          takeUntil(this.destroyed$)
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }



  // Загрузка сцены
  private loadScene(): Observable<number> {
    const textures: Partial<LoadTexture>[] = [
      ...this.landscape3DService.textures,
      ...this.worldOcean3DService.textures,
    ];
    // Обновить загрузчик
    this.loadingStep = LoadingStep.prepared;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.engine3DService.create(this.canvas.nativeElement, this.helper.nativeElement);
    this.landscape3DService.create();
    // Получение текстур
    textures.map(loadTexture => this.textures.push({
      url: loadTexture.url,
      loaded: false,
      size: 0,
      loadedSize: 0,
      afterLoadEvent: loadTexture?.afterLoadEvent ?? VoidFunctionVar
    }));
    // Заполнение действий
    this.fillCellsActions();
    this.fillCalcActions();
    // Задержка
    return timer(1);
  }

  // Загрузка сведений о текстурах
  private getTexturesData(): Observable<any> {
    return ConsistentResponses(
      this.textures.map(data => this.screenService.getImageSize(data.url).pipe(
        tap(size => {
          data.size = size;
          // Обновить
          this.changeDetectorRef.detectChanges();
        }),
        delay(1)
      ))
    );
  }

  // Загрузка текстур
  private loadTextures(): Observable<any> {
    this.loadingStep = LoadingStep.loadTextures;
    this.changeDetectorRef.detectChanges();
    // Загрузка
    return ConsistentResponses(
      this.textures
        .sort(({ size: a }, { size: b }) => b - a)
        .map(data => Load3DTexture(data.url).pipe(
          tap(texture => {
            data.loaded = true;
            data.loadedSize = data.size;
            // Вызвать событие
            if (!!data?.afterLoadEvent) {
              data.afterLoadEvent(texture);
            }
            // Обновить
            this.changeDetectorRef.detectChanges();
          })
        ))
    );
  }

  // Создать цикл ячеек
  private createLandScapeCycle(): Observable<any> {
    const repeat: number = (this.landscape3DService.outSideRepeat * 2) + 1;
    const width: number = this.dreamMap?.size.width;
    const height: number = this.dreamMap?.size.height;
    const totalWidth: number = (width * repeat) + 1;
    const totalHeight: number = (height * repeat) + 1;
    // Состояния
    this.loadingCeilLimit = totalWidth * totalHeight;
    // Цикл по функциям
    return ConsistentResponses(this.ceilsOperations.map(operation => timer(1).pipe(
      concatMap(() => {
        const step = operation?.setStep ?? LoadingStep.ceilsLoad;
        const args = ArrayMap(operation.args ?? [], arg => typeof arg === "function"
          ? arg()
          : arg
        );
        // Вызов функции
        return this.loadLandScape(operation.callable.bind(operation.context, ...args), step);
      })
    )));
  }

  // Загрузка ячеек ландшафта
  private loadLandScape(callback: CeilCallBack, step: LoadingStep): Observable<any> {
    const repeat: number = (this.landscape3DService.outSideRepeat * 2) + 1;
    const width: number = this.dreamMap?.size.width;
    const height: number = this.dreamMap?.size.height;
    const totalWidth: number = (width * repeat) + 1;
    const totalHeight: number = (height * repeat) + 1;
    const widthShift: number = this.landscape3DService.outSideRepeat * width;
    const heightShift: number = this.landscape3DService.outSideRepeat * height;
    // Состояния
    this.loadingCeilCurrent[step] = 0;
    this.loadingStep = step;
    // Обновить
    this.changeDetectorRef.detectChanges();
    // Подписка
    return TakeCycle(this.loadingCeilLimit, this.loadCeilsByTime).pipe(
      tap(i => {
        this.loadingCeilCurrent[step] = clamp(i + 1, this.loadingCeilLimit);
        // Обновить
        this.changeDetectorRef.detectChanges();
      }),
      switchMap(i => i < this.loadingCeilLimit
        ? of(GetCoordsByIndex(totalWidth, totalHeight, i))
        : throwError(() => null)
      ),
      map(({ x, y }) => ({ x: x - widthShift, y: y - heightShift })),
      tap(({ x, y }) => callback(this.ceil3dService.getCeil(x, y))),
      skipWhile(() => this.loadingCeilCurrent[step] < this.loadingCeilLimit),
      catchError(() => of(null))
    );
  }

  // Запуск функций вычислений
  private callCalcMethods(): Observable<any> {
    this.loadingStep = LoadingStep.calcMethods;
    this.changeDetectorRef.detectChanges();
    // Цикл по функциям
    return ConsistentResponses(this.calcOperations.map(operation => of(operation).pipe(
      tap(operation => {
        const args = ArrayMap(operation.args ?? [], arg => typeof arg === "function"
          ? arg()
          : arg
        );
        // Вызов функции
        operation.callable.bind(operation.context)(...args);
        operation.called = true;
        // Обновить
        this.changeDetectorRef.detectChanges();
      }),
      delay(this.calcOperationLoadingDelay)
    )));
  }

  // Создание статистики
  private createStats(): Observable<any> {
    if (this.debugInfo) {
      return WaitObservable(() => !this.statsBlock?.nativeElement).pipe(
        tap(() => this.statsBlock.nativeElement.appendChild(this.engine3DService.stats.dom)),
        delay(1),
      );
    }
    // Нет информации
    return timer(1);
  }

  // Прослушивание событий
  private dreamMapChangesListeners(): Observable<any> {
    const moveEvent = this.isTouchDevice
      ? "touchmove"
      : "mousemove";
    // Подписчик
    return merge(
      // Изменение времени
      this.skyTime$.pipe(tap(skyTime => this.onSkyUpdate(skyTime))),
      this.worldOceanHeight$.pipe(tap(worldOceanHeight => this.onWorldOceanUpdate(worldOceanHeight))),
      // Движение мышкой
      fromEvent<MouseEvent | TouchEvent>(document, moveEvent).pipe(tap(event => this.onMouseIntersectionUpdate(event)))
    ).pipe(
      observeOn(animationFrameScheduler)
    );
  }



  // Заполнить список действий над ячейками
  private fillCellsActions(): void {
    this.ceilsOperations.push(
      // Запись высот в общий массив
      {
        callable: this.landscape3DService.setHeightByCoords,
        context: this.landscape3DService,
        setStep: LoadingStep.ceilsLoad
      },
      // Сглаживание высот
      {
        callable: this.landscape3DService.setSmoothByCoords,
        context: this.landscape3DService,
        setStep: LoadingStep.ceilsSmooth
      },
      // Установка высот в гуометрию
      {
        callable: this.landscape3DService.setVertexByCoords,
        context: this.landscape3DService,
        setStep: LoadingStep.ceilsSet
      }
    );
  }

  // Заполнить список действий над сценой
  private fillCalcActions(): void {
    this.calcOperations.push(
      // Создание неба
      {
        callable: () => {
          this.sky3DService.renderer = this.engine3DService.renderer;
          this.sky3DService.create();
        },
        context: this
      },
      // Создание мирового океана
      {
        callable: () => {
          this.worldOcean3DService.renderer = this.engine3DService.renderer;
          this.worldOcean3DService.create();
        },
        context: this
      },
      // Обновить геометрию ландшафта
      {
        callable: this.landscape3DService.updateGeometry,
        context: this.landscape3DService
      },
      // Обновить материал ландшафта
      {
        callable: this.landscape3DService.updateMaterial,
        context: this.landscape3DService
      },
      // Создать туман
      {
        callable: this.engine3DService.setFog,
        context: this.engine3DService,
        args: [
          () => this.sky3DService.fog
        ]
      },
      // Создание курсора
      {
        callable: this.cursor3DService.create,
        context: this.cursor3DService
      },
      // Добавить объекты на сцену
      {
        callable: this.engine3DService.addToScene,
        context: this.engine3DService,
        args: [
          () => this.landscape3DService.mesh,
          () => this.sky3DService.sky,
          () => this.sky3DService.sun,
          () => this.sky3DService.atmosphere,
          () => this.worldOcean3DService.ocean,
          () => this.cursor3DService.group,
          // () => this.sky3DService.clouds
        ]
      },
      // Добавить объекты в пересечения курсора
      {
        callable: this.engine3DService.addToIntersection,
        context: this.engine3DService,
        args: [
          () => this.landscape3DService.mesh,
          () => this.worldOcean3DService.ocean
        ]
      },
      // Анимация ландшафта
      {
        callable: this.engine3DService.addToAnimation,
        context: this.engine3DService,
        args: [
          () => this.sky3DService.onAnimate.bind(this.sky3DService),
          () => this.worldOcean3DService.onAnimate.bind(this.worldOcean3DService)
        ]
      },
      // Сфокусировать камеру
      {
        callable: this.engine3DService.onCameraChange,
        context: this.engine3DService,
        args: [
          () => this.engine3DService.control
        ]
      }
    );
  }



  // Все загружено
  private onViewerLoad(): Observable<number> {
    this.loadingStep = LoadingStep.stopped;
    // Обновить
    this.changeDetectorRef.detectChanges();
    // Таймер
    return timer(1);
  }

  // Обновление времени
  private onSkyUpdate(skyTime: number): void {
    if (this.dreamMap.sky.time !== skyTime) {
      this.dreamMap.isChanged = true;
      this.dreamMap.sky.time = skyTime;
      this.sky3DService.updateSky();
    }
  }

  // Обновление времени
  private onWorldOceanUpdate(worldOceanHeight: number): void {
    if (this.dreamMap.ocean.z !== worldOceanHeight) {
      this.dreamMap.isChanged = true;
      this.dreamMap.ocean.z = worldOceanHeight;
      this.worldOcean3DService.updateWorldOcean();
      this.cursor3DService.clearIntersectionCache();
      this.engine3DService.onUpdatePostProcessors();
    }
  }

  // Обновление пересечения с мышкой
  private onMouseIntersectionUpdate(event: MouseEvent | TouchEvent): void {
    if (this.showCursor) {
      if (CompareElementByElement(event.target, this.canvas.nativeElement)) {
        let x: number = -1;
        let y: number = -1;
        const canvasRect = this.canvas.nativeElement.getBoundingClientRect();
        const eventData = event instanceof MouseEvent
          ? event
          : event.touches.item(0);
        const screenX = eventData.clientX - canvasRect.left;
        const screenY = eventData.clientY - canvasRect.top;
        const objects = this.engine3DService.getIntercectionObject(screenX, screenY) ?? [];
        const object = ArrayFilter(objects, ({ object: { name } }) => this.cursor3DService.hoverItems.includes(name))?.[objects.length - 1];
        // Изменить координаты определения
        if (!!object) {
          const mapWidth = this.dreamMap?.size.width;
          const mapHeight = this.dreamMap?.size.height;
          const tempX = floor(object.point.x / this.settings3DService.ceilSize) + (mapWidth * this.settings3DService.ceilSize / 2);
          const tempY = floor(object.point.z / this.settings3DService.ceilSize) + (mapHeight * this.settings3DService.ceilSize / 2);
          // Координаты в рабочей области
          if (!this.ceil3dService.isBorderCeil(tempX, tempY)) {
            x = tempX;
            y = tempY;
          }
        }
        // Запомнить новые координаты
        this.store$.dispatch(editor3DHoveringCeil({ hoverCeil: { x, y } }));
      }
      // Потеря фокуса
      else {
        this.store$.dispatch(editor3DHoveringCeil({ hoverCeil: { x: -1, y: -1 } }));
      }
    }
  }
}



// Тип функции для ячейки
type CeilCallBack = (ceil: DreamMapCeil) => void;

// Стадии загрузки
enum LoadingStep {
  stopped,
  prepared,
  ceilsLoad,
  ceilsSmooth,
  ceilsSet,
  calcMethods,
  loadTextures
}

// Состояние лоадера
interface ProgressState {
  progress: number;
  icon: string;
  mode: ProgressBarMode;
  subSteps: number;
  completedSubSteps: number;
}

// Интерфейс функций высчитывания геометрий
interface CalcFunction<I = undefined, O = void> {
  callable: (...data: I[]) => O;
  called?: boolean;
  context: any;
  args?: any[];
  setStep?: LoadingStep;
}

// Список состояний с прогрессом
const LoaderCeilsSteps: LoadingStep[] = [
  LoadingStep.ceilsLoad,
  LoadingStep.ceilsSmooth,
  LoadingStep.ceilsSet
];

// Список состояний с прогрессом
const LoaderProgressSteps: LoadingStep[] = [
  ...LoaderCeilsSteps,
  LoadingStep.calcMethods,
  LoadingStep.loadTextures
];

// Иконки лоадера
const LoaderIcons: CustomObjectKey<LoadingStep | typeof DefaultKey, string> = {
  [DefaultKey]: "settings",
  [LoadingStep.ceilsLoad]: "filter_hdr",
  [LoadingStep.ceilsSmooth]: "filter_hdr",
  [LoadingStep.ceilsSet]: "filter_hdr",
  [LoadingStep.calcMethods]: "function",
  [LoadingStep.loadTextures]: "photo_library"
};
