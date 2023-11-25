import { VoidFunctionVar } from "@_datas/app";
import { Load3DTexture } from "@_datas/three.js/core/texture";
import { CheckInRange, Cos, MathFloor, MathRound, ParseInt, Sin } from "@_helpers/math";
import { GetCoordsByIndex } from "@_helpers/objects";
import { ConsistentResponses, TakeCycle, WaitObservable } from "@_helpers/rxjs";
import { CustomObjectKey, DefaultKey, SimpleObject } from "@_models/app";
import { DreamMap } from "@_models/dream-map";
import { LoadTexture } from "@_models/three.js/base";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { Engine3DService } from "@_services/3d/engine-3d.service";
import { Landscape3DService } from "@_services/3d/landscape-3d.service";
import { ScreenService } from "@_services/screen.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { viewer3DCompassSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { Observable, Subject, catchError, concatMap, delay, map, of, skipWhile, switchMap, takeUntil, tap, throwError } from "rxjs";





@Component({
  selector: "viewer-3d",
  templateUrl: "./viewer-3d.component.html",
  styleUrls: ["viewer-3d.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Viewer3DComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input() dreamMap: DreamMap;
  @Input() debugInfo: boolean = true;
  @Input() showCompass: boolean = true;

  @ViewChild("canvas") private canvas: ElementRef;
  @ViewChild("helper") private helper: ElementRef;
  @ViewChild("statsBlock") private statsBlock: ElementRef;

  private loadCeilsByTime: number = 250;
  private calcOperationLoadingSize: number = 500;
  private texturesLoadingSize: number = 0.003;
  private loadCeilCircles: number = 3;
  private compassAzimuthShift: number = -90;
  private compassRadialShift: number = 45;

  loadingStep: LoadingStep = LoadingStep.prepared;
  loadingSteps: typeof LoadingStep = LoadingStep;
  private loadingCeilLimit: number = 0;
  private loadingCeilCurrent: number = 0;

  private textures: LoadTexture[] = [];
  private calcOperations: CalcFunction[] = [];

  private compass$ = this.store$.select(viewer3DCompassSelector);

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
    const withProgress: boolean = LoaderProgressSteps.includes(this.loadingStep);
    const mode: ProgressBarMode = withProgress ? "determinate" : "indeterminate";
    const icon: string = LoaderIcons?.[this.loadingStep] ?? LoaderIcons[DefaultKey];
    let subSteps: number = 0;
    let completedSubSteps: number = 0;
    // Функции просчета сцены
    const allCalcSize: number = this.calcOperations.length * this.calcOperationLoadingSize;
    const completedCalcSize: number = this.calcOperations.filter(d => !!d?.called).length * this.calcOperationLoadingSize;
    // Текстуры
    const allTexturesSize: number = this.textures.reduce((o, { size }) => o + size, 0) * this.texturesLoadingSize;
    const loadedTexturesSize: number = this.textures.reduce((o, { loadedSize }) => o + loadedSize, 0) * this.texturesLoadingSize;
    // Прогресс
    const maxOperations: number = this.loadingCeilLimit + allCalcSize + allTexturesSize;
    const currentOperation: number = 1 + (this.loadingCeilCurrent + completedCalcSize) + loadedTexturesSize;
    const progress: number = withProgress && maxOperations > 0
      ? MathRound((currentOperation / maxOperations) * 100, 3)
      : 0;
    // Подшаги для ячеек
    if (this.loadingStep === LoadingStep.landScapeCeils) {
      subSteps = MathRound(this.loadingCeilLimit / this.loadCeilCircles);
      completedSubSteps = MathRound(this.loadingCeilCurrent / this.loadCeilCircles);
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





  constructor(
    private ceil3dService: Ceil3dService,
    private engine3DService: Engine3DService,
    private landscape3DService: Landscape3DService,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private store$: Store
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.dreamMap) {
      this.ceil3dService.dreamMap = this.dreamMap;
      this.engine3DService.dreamMap = this.dreamMap;
      this.landscape3DService.dreamMap = this.dreamMap;
    }
  }

  ngAfterViewInit(): void {
    if (!!window.WebGLRenderingContext) {
      WaitObservable(() => !this.canvas?.nativeElement || !this.helper?.nativeElement || !this.dreamMap)
        .pipe(
          tap(() => this.loadScene()),
          delay(1),
          concatMap(() => this.getTexturesData()),
          delay(1),
          concatMap(() => this.loadTextures()),
          delay(1),
          concatMap(() => this.loadLandScape()),
          delay(1),
          concatMap(() => this.callCalcMethods()),
          delay(1),
          tap(() => this.onViewerLoad()),
          delay(1),
          tap(() => this.createStats()),
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
  private loadScene(): void {
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
    // Обновить геометрию
    this.calcOperations.push({
      callable: this.landscape3DService.updateGeometry,
      context: this.landscape3DService
    });
    // Добавить объект на сцену
    this.calcOperations.push({
      callable: this.engine3DService.addToScene,
      context: this.engine3DService,
      args: [this.landscape3DService.mesh]
    });
    // Добавить объект в пересечения курсора
    this.calcOperations.push({
      callable: this.engine3DService.addToCursorIntersection,
      context: this.engine3DService,
      args: [this.landscape3DService.mesh]
    });
  }

  // Загрузка сведений о текстурах
  private getTexturesData(): Observable<any> {
    return ConsistentResponses(
      this.textures.map(data => this.screenService.getImageSize(data.url).pipe(
        tap(size => {
          data.size = size;
          // Обновить
          this.changeDetectorRef.detectChanges();
        })
      ))
    );
  }

  // Загрузка текстур
  private loadTextures(): Observable<any> {
    this.loadingStep = LoadingStep.loadTextures;
    this.changeDetectorRef.detectChanges();
    // Загрузка
    return ConsistentResponses(
      this.textures.map(data => Load3DTexture(data.url).pipe(
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

  // Загрузка ячеек ландшафта
  private loadLandScape(): Observable<any> {
    const repeat: number = (this.landscape3DService.outSideRepeat * 2) + 1;
    const width: number = ParseInt(this.dreamMap.size.width);
    const height: number = ParseInt(this.dreamMap.size.height);
    const totalWidth: number = (width * repeat) + 1;
    const totalHeight: number = (height * repeat) + 1;
    const widthShift: number = this.landscape3DService.outSideRepeat * width;
    const heightShift: number = this.landscape3DService.outSideRepeat * height;
    const totalSize: number = totalWidth * totalHeight;
    // Состояния
    this.loadingCeilLimit = totalSize * this.loadCeilCircles;
    this.loadingCeilCurrent = 0;
    this.loadingStep = LoadingStep.landScapeCeils;
    this.changeDetectorRef.detectChanges();
    // Подписка
    return TakeCycle(this.loadingCeilLimit + 1, this.loadCeilsByTime).pipe(
      tap(i => {
        this.loadingCeilCurrent = CheckInRange(i, this.loadingCeilLimit);
        this.changeDetectorRef.detectChanges();
      }),
      map(i => ({ i, circle: MathFloor(i / totalSize) })),
      switchMap(({ i, circle }) => i < this.loadingCeilLimit
        ? of({ coords: GetCoordsByIndex(totalWidth, totalHeight, i - (circle * totalSize)), circle })
        : throwError(() => null)
      ),
      map(data => ({
        ...data,
        coords: {
          x: data.coords.x - widthShift,
          y: data.coords.y - heightShift
        }
      })),
      tap(({ coords: { x, y }, circle }) => {
        const ceil = this.ceil3dService.getCeil(x, y);
        // Рассчет высот
        if (circle === 0) {
          return this.landscape3DService.setHeightByCoords(ceil);
        }
        // Сглаживание
        else if (circle === 1) {
          return this.landscape3DService.setSmoothByCoords(ceil);
        }
        // Выставление высот
        return this.landscape3DService.setVertexByCoords(ceil);
      }),
      skipWhile(() => this.loadingCeilCurrent < this.loadingCeilLimit),
      catchError(() => of(null))
    );
  }

  // Запуск функций вычислений
  private callCalcMethods(): Observable<any> {
    this.loadingStep = LoadingStep.calcMethods;
    this.changeDetectorRef.detectChanges();
    // Цикл по функциям
    return ConsistentResponses(this.calcOperations.map(operation => of(true).pipe(
      tap(() => {
        operation.callable.bind(operation.context)(...(operation.args ?? []));
        operation.called = true;
        // Обновить
        this.changeDetectorRef.detectChanges();
      })
    )));
  }

  // Создание статистики
  private createStats(): void {
    if (!!this.statsBlock?.nativeElement) {
      this.statsBlock.nativeElement.appendChild(this.engine3DService.stats.dom);
    }
  }





  // Все загружено
  private onViewerLoad(): void {
    this.loadingStep = LoadingStep.stopped;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }
}





// Стадии загрузки
enum LoadingStep {
  stopped,
  prepared,
  landScapeCeils,
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
interface CalcFunction {
  callable: Function;
  called?: boolean;
  context: any;
  args?: any[];
}

// Список состояний с прогрессом
const LoaderProgressSteps: LoadingStep[] = [
  LoadingStep.landScapeCeils,
  LoadingStep.calcMethods,
  LoadingStep.loadTextures
];

// Иконки лоадера
const LoaderIcons: CustomObjectKey<LoadingStep | typeof DefaultKey, string> = {
  [DefaultKey]: "settings",
  [LoadingStep.landScapeCeils]: "filter_hdr",
  [LoadingStep.calcMethods]: "function",
  [LoadingStep.loadTextures]: "photo_library"
};
