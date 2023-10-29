import { CheckInRange, MathRound, ParseInt } from "@_helpers/math";
import { GetCoordsByIndex } from "@_helpers/objects";
import { TakeCycle, WaitObservable } from "@_helpers/rxjs";
import { CustomObjectKey, DefaultKey } from "@_models/app";
import { DreamMap } from "@_models/dream-map";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { ProgressBarMode } from "@angular/material/progress-bar";
import { Observable, Subject, catchError, concatMap, of, skipWhile, switchMap, takeUntil, tap, throwError } from "rxjs";





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

  loadingStep: LoadingStep = LoadingStep.prepared;
  loadingSteps: typeof LoadingStep = LoadingStep;
  loadingCeilLimit: number = 0;
  loadingCeilCurrent: number = 0;

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
      ? MathRound((currentOperation / maxOperations) * 100)
      : 0;
    // Вернуть состояние
    return { mode, icon, progress };
  }





  // Загрузка ландшафта
  private loadLandScape(): Observable<any> {
    const width: number = ParseInt(this.dreamMap.size.width);
    const height: number = ParseInt(this.dreamMap.size.height);
    // Состояния
    this.loadingCeilLimit = width * height;
    this.loadingCeilCurrent = 0;
    this.loadingStep = LoadingStep.landScape;
    this.changeDetectorRef.detectChanges();
    // Подписка
    return TakeCycle(this.loadingCeilLimit + 1, 5).pipe(
      tap(i => {
        this.loadingCeilCurrent = CheckInRange(i, this.loadingCeilLimit);
        this.changeDetectorRef.detectChanges();
      }),
      switchMap(i => i < this.loadingCeilLimit
        ? of(GetCoordsByIndex(width, height, i))
        : throwError(() => null)
      ),
      tap(({ x, y }) => { }),
      skipWhile(() => this.loadingCeilCurrent < this.loadingCeilLimit),
      catchError(() => of(null))
    );
  }





  constructor(
    private ceil3dService: Ceil3dService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.dreamMap) {
      this.ceil3dService.dreamMap = this.dreamMap;
    }
  }

  ngAfterViewInit(): void {
    if (!!window.WebGLRenderingContext) {
      WaitObservable(() => !this.canvas?.nativeElement || !this.dreamMap)
        .pipe(
          takeUntil(this.destroyed$),
          concatMap(() => this.loadLandScape())
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
