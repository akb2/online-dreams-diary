import { CheckInRange, Cos, MathFloor, MathRound, ParseInt, Sin } from "@_helpers/math";
import { GetCoordsByIndex } from "@_helpers/objects";
import { TakeCycle, WaitObservable } from "@_helpers/rxjs";
import { CustomObjectKey, DefaultKey } from "@_models/app";
import { DreamMap } from "@_models/dream-map";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { Engine3DService } from "@_services/3d/engine-3d.service";
import { Landscape3DService } from "@_services/3d/landscape-3d.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { viewer3DCompassSelector } from "@app/reducers/viewer-3d";
import { Store } from "@ngrx/store";
import { Observable, Subject, catchError, concatMap, map, of, skipWhile, switchMap, takeUntil, tap, throwError } from "rxjs";





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

  loadingStep: LoadingStep = LoadingStep.prepared;
  loadingSteps: typeof LoadingStep = LoadingStep;
  private loadingCeilLimit: number = 0;
  private loadingCeilCurrent: number = 0;
  private loadCeilsByTime: number = 250;

  private compassAzimuthShift: number = -90;
  compassRadialShift: number = 45;

  compassStyles$ = this.store$.select(viewer3DCompassSelector).pipe(map(({ radial, azimuth }) => ({
    transform: (
      " rotateX(" + (azimuth - this.compassAzimuthShift) + "deg) " +
      " rotateZ(" + (radial - this.compassRadialShift) + "deg) "
    )
  })));

  compassLabelStyles$ = this.store$.select(viewer3DCompassSelector).pipe(map(({ radial, azimuth }) => {
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

  private destroyed$: Subject<void> = new Subject();





  // Состояние лоадера
  get progressBarState(): ProgressState {
    const withProgress: boolean = LoaderProgressSteps.includes(this.loadingStep);
    const mode: ProgressBarMode = withProgress ? "determinate" : "indeterminate";
    const icon: string = LoaderIcons?.[this.loadingStep] ?? LoaderIcons[DefaultKey];
    // Прогресс
    const maxOperations: number = this.loadingCeilLimit;
    const currentOperation: number = 1 + (this.loadingCeilCurrent);
    const progress: number = withProgress && maxOperations > 0
      ? MathRound((currentOperation / maxOperations) * 100, 3)
      : 0;
    // Вернуть состояние
    return { mode, icon, progress };
  }





  // Загрузка сцены
  private loadScene(): void {
    this.loadingStep = LoadingStep.prepared;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.engine3DService.create(this.canvas.nativeElement, this.helper.nativeElement);
  }

  // Загрузка ландшафта
  private loadLandScape(): Observable<any> {
    const repeat: number = (this.landscape3DService.outSideRepeat * 2) + 1;
    const width: number = ParseInt(this.dreamMap.size.width);
    const height: number = ParseInt(this.dreamMap.size.height);
    const totalWidth: number = width * repeat;
    const totalHeight: number = height * repeat;
    const widthShift: number = this.landscape3DService.outSideRepeat * width;
    const heightShift: number = this.landscape3DService.outSideRepeat * height;
    const totalSize: number = totalWidth * totalHeight;
    // Состояния
    this.loadingCeilLimit = totalSize * 2;
    this.loadingCeilCurrent = 0;
    this.loadingStep = LoadingStep.landScape;
    this.changeDetectorRef.detectChanges();
    // Создание объекта ландшафта
    this.landscape3DService.create(width, height);
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
      tap(({ coords: { x, y }, circle }) => circle === 0
        ? this.landscape3DService.setHeightByCoords(this.ceil3dService.getCeil(x, y))
        : this.landscape3DService.setVertexByCoords(this.ceil3dService.getCeil(x, y))
      ),
      skipWhile(() => this.loadingCeilCurrent < this.loadingCeilLimit),
      catchError(() => {
        this.engine3DService.addToScene(this.landscape3DService.mesh);
        // Перейти далее
        return of(null);
      })
    );
  }





  constructor(
    private ceil3dService: Ceil3dService,
    private engine3DService: Engine3DService,
    private landscape3DService: Landscape3DService,
    private changeDetectorRef: ChangeDetectorRef,
    private store$: Store
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.dreamMap) {
      this.ceil3dService.dreamMap = this.dreamMap;
      this.engine3DService.dreamMap = this.dreamMap;
    }
  }

  ngAfterViewInit(): void {
    if (!!window.WebGLRenderingContext) {
      WaitObservable(() => !this.canvas?.nativeElement || !this.helper?.nativeElement || !this.dreamMap)
        .pipe(
          tap(() => this.loadScene()),
          concatMap(() => this.loadLandScape()),
          takeUntil(this.destroyed$)
        )
        .subscribe(() => this.onViewerLoad());
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Все загружено
  private onViewerLoad(): void {
    this.loadingStep = LoadingStep.stopped;
    this.changeDetectorRef.detectChanges();
  }
}





// Стадии загрузки
enum LoadingStep {
  stopped,
  prepared,
  landScape
}

// Состояние лоадера
interface ProgressState {
  progress: number;
  icon: string;
  mode: ProgressBarMode;
}

// Список состояний с прогрессом
const LoaderProgressSteps: LoadingStep[] = [
  LoadingStep.landScape
];

// Иконки лоадера
const LoaderIcons: CustomObjectKey<LoadingStep | typeof DefaultKey, string> = {
  [DefaultKey]: "settings",
  [LoadingStep.landScape]: "filter_hdr"
};
