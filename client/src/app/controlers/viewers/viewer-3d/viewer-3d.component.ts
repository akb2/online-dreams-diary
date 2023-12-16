import { VoidFunctionVar } from "@_datas/app";
import { DreamCeilSize } from "@_datas/dream-map-settings";
import { Load3DTexture } from "@_datas/three.js/core/texture";
import { AverageSumm, CheckInRange, Cos, MathFloor, MathRound, ParseInt, Sin } from "@_helpers/math";
import { ArrayFilter, ArrayMap, GetCoordsByIndex } from "@_helpers/objects";
import { ConsistentResponses, TakeCycle, WaitObservable } from "@_helpers/rxjs";
import { CustomObjectKey, DefaultKey, SimpleObject } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { LoadTexture } from "@_models/three.js/base";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { Cursor3DService } from "@_services/3d/cursor-3d.service";
import { Engine3DService } from "@_services/3d/engine-3d.service";
import { Landscape3DService } from "@_services/3d/landscape-3d.service";
import { Sky3DService } from "@_services/3d/sky-3d.service";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { editor3DShowControlsSelector, editor3DSkyTimeSelector, viewer3DCompassSelector, viewer3DInitialLoaderDisableAction, viewer3DInitialLoaderEnableAction, viewer3DInitialLoaderSelector } from "@app/reducers/viewer-3d";
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

  private loadCeilsByTime = 250;
  private calcOperationLoadingSize = 500;
  private calcOperationLoadingDelay = 80;
  private texturesLoadingSize = 1000;
  private compassAzimuthShift = -90;
  private compassRadialShift = 45;

  private loadingCeilLimit = 0;
  private loadingCeilCurrent: CustomObjectKey<LoadingStep, number> = {};

  private textures: LoadTexture[] = [];
  private ceilsOperations: CalcFunction<DreamMapCeil>[] = [];
  private calcOperations: CalcFunction[] = [];

  loading$ = this.store$.select(viewer3DInitialLoaderSelector);
  showControls$ = this.store$.select(editor3DShowControlsSelector);

  private compass$ = this.store$.select(viewer3DCompassSelector);
  private skyTime$ = this.store$.select(editor3DSkyTimeSelector);

  compassStyles$ = this.compass$.pipe(map(({ radial, azimuth }) => ({
    transform: (
      " rotateX(" + (azimuth - this.compassAzimuthShift) + "deg) " +
      " rotateZ(" + (radial - this.compassRadialShift) + "deg) "
    )
  })));

  compassLabelStyles$ = this.compass$.pipe(map(({ radial, azimuth }) => {
    const koof: number = -Sin(azimuth);
    const depth: number = 0.5 - ((Cos(radial) / 2) * koof);
    // Объект стилей
    return {
      top: (depth * 100) + "%",
      left: ((Sin(radial) + 1) * 50) + "%",
      transform: (
        " translateX(-50%) " +
        " translateY(-50%) "
      )
    };
  }));

  compassMarkAreaStyles$ = this.compass$.pipe(map(({ cos, sin }) => {
    const value: number = 50;
    const top: number = (value * cos) + value;
    const left: number = (value * sin) + value;
    // Объект стилей
    return {
      marginTop: top + "%",
      marginLeft: left + "%"
    };
  }));

  compassMarkColumnStyles$ = this.compass$.pipe(map(({ radial }) => ({
    transform: (
      " rotateX(-90deg) " +
      " rotateY(" + radial + "deg) "
    )
  })));

  compassMarkHeadStyles$ = this.compass$.pipe(map(({ azimuth }) => ({
    transform: (
      "rotateX(" + (-azimuth) + "deg)"
    )
  })));

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
      ? MathRound((currentOperation / maxOperations) * 100, 3)
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

  // Корректировка поворота компаса
  get compassCorrectStyles(): SimpleObject {
    return {
      transform: "rotate(" + this.compassRadialShift + "deg)"
    };
  }

  // Проверка сенсорного экрана
  private get isTouchDevice(): boolean {
    return "ontouchstart" in window || !!navigator?.maxTouchPoints;
  }





  constructor(
    private ceil3dService: Ceil3dService,
    private engine3DService: Engine3DService,
    private landscape3DService: Landscape3DService,
    private sky3DService: Sky3DService,
    private cursor3DService: Cursor3DService,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private store$: Store
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.dreamMap) {
      this.ceil3dService.dreamMap = this.dreamMap;
      this.engine3DService.dreamMap = this.dreamMap;
      this.landscape3DService.dreamMap = this.dreamMap;
      this.sky3DService.dreamMap = this.dreamMap;
    }
  }

  ngAfterViewInit(): void {
    if (!!window.WebGLRenderingContext) {
      this.store$.dispatch(viewer3DInitialLoaderEnableAction());
      // Цикл загрузок
      WaitObservable(() => !this.canvas?.nativeElement || !this.helper?.nativeElement || !this.dreamMap)
        .pipe(
          concatMap(() => this.loadScene()),
          concatMap(() => this.getTexturesData()),
          concatMap(() => this.loadTextures()),
          concatMap(() => this.createLandScapeCycle()),
          concatMap(() => this.callCalcMethods()),
          concatMap(() => this.onViewerLoad()),
          tap(() => this.store$.dispatch(viewer3DInitialLoaderDisableAction())),
          concatMap(() => this.createStats()),
          concatMap(() => this.dreamMapChangesListeners()),
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
      ...this.landscape3DService.textures
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
    // Функции просчета ячеек
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
    // Функции после просчета ячеек
    this.calcOperations.push(
      // Создание неба
      {
        callable: () => {
          this.sky3DService.renderer = this.engine3DService.renderer;
          this.sky3DService.create();
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
      // Добавить объекты на сцену
      {
        callable: this.engine3DService.addToScene,
        context: this.engine3DService,
        args: [
          () => this.landscape3DService.mesh,
          () => this.sky3DService.sky,
          () => this.sky3DService.sun,
          () => this.sky3DService.atmosphere,
          // () => this.sky3DService.clouds
        ]
      },
      // Добавить объекты в пересечения курсора
      {
        callable: this.engine3DService.addToCursorIntersection,
        context: this.engine3DService,
        args: [
          () => this.landscape3DService.mesh
        ]
      },
      // Анимация ландшафта
      {
        callable: this.engine3DService.addToAnimation,
        context: this.engine3DService,
        args: [
          () => this.sky3DService.onAnimate.bind(this.sky3DService)
        ]
      }
    );
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
    const width: number = this.dreamMap.size.width;
    const height: number = this.dreamMap.size.height;
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
    const width: number = this.dreamMap.size.width;
    const height: number = this.dreamMap.size.height;
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
        this.loadingCeilCurrent[step] = CheckInRange(i + 1, this.loadingCeilLimit);
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
      // Движение мышкой
      fromEvent<MouseEvent | TouchEvent>(this.canvas.nativeElement, moveEvent).pipe(tap(event => this.onMouseIntersectionUpdate(event)))
    ).pipe(
      observeOn(animationFrameScheduler)
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
    this.dreamMap.sky.time = skyTime;
    this.sky3DService.updateSky();
  }

  // Обновление пересечения с мышкой
  private onMouseIntersectionUpdate(event: MouseEvent | TouchEvent): void {
    let x: number = -1;
    let y: number = -1;
    const canvasRect = this.canvas.nativeElement.getBoundingClientRect();
    const eventData = event instanceof MouseEvent
      ? event
      : event.touches.item(0);
    const screenX = eventData.clientX - canvasRect.left;
    const screenY = eventData.clientY - canvasRect.top;
    const objects = this.engine3DService.getIntercectionObject(screenX, screenY) ?? [];
    const object = ArrayFilter(objects, ({ object: { name } }) => this.cursor3DService.hoverItems.includes(name))?.[0];
    // Изменить координаты определения
    if (!!object) {
      const mapWidth = this.dreamMap.size.width;
      const mapHeight = this.dreamMap.size.height;
      const tempX = MathFloor(object.point.x / DreamCeilSize) + (mapWidth * DreamCeilSize / 2);
      const tempY = MathFloor(object.point.z / DreamCeilSize) + (mapHeight * DreamCeilSize / 2);
      // Координаты в рабочей области
      if (!this.ceil3dService.isBorderCeil(tempX, tempY)) {
        x = tempX;
        y = tempY;
      }
    }
    // Запомнить новые координаты
    console.log(x, y);
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
