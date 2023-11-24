import { VoidFunctionVar } from "@_datas/app";
import { PerlinNoiseGenerator } from "@_datas/three.js/helpers/perlin-noise-generator";
import { Average, CheckInRange, LineFunc, MathRound } from "@_helpers/math";
import { GetCoordsByIndex } from "@_helpers/objects";
import { TakeCycle } from "@_helpers/rxjs";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { Subject, map, takeUntil, tap } from "rxjs";





@Component({
  selector: "dev-lindenmayer-fractals",
  templateUrl: "./lindenmayer-fractals.component.html",
  styleUrls: ["lindenmayer-fractals.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LindenmayerFractalsComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canvas", { read: ElementRef }) canvas: ElementRef<HTMLCanvasElement>;

  size = 300;
  inProgress = false;

  private noiseLargeScale = 70;
  private noiseMiddleScale = 35;
  private noiseSmallScale = 6;
  private fillColor = 80;
  private drawColor = 255;

  private destroyed$ = new Subject<void>();





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngAfterViewInit() {
    if (!!this.canvas?.nativeElement) {
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext("2d");
      const perlinNoise = new PerlinNoiseGenerator(this.size);
      // Отметка о начале
      this.inProgress = true;
      this.changeDetectorRef.detectChanges();
      // Отрисовка
      TakeCycle(this.size * this.size, 10000)
        .pipe(
          takeUntil(this.destroyed$),
          map(i => GetCoordsByIndex(this.size, this.size, i)),
          tap(({ x, y }) => {
            const noise = Average([
              perlinNoise.noise(x / this.noiseLargeScale, y / this.noiseLargeScale),
              perlinNoise.noise(x / this.noiseMiddleScale, y / this.noiseMiddleScale),
              perlinNoise.noise(x / this.noiseSmallScale, y / this.noiseSmallScale)
            ]);
            const preColor = CheckInRange(MathRound(LineFunc(this.fillColor, this.drawColor, noise * 2, -1, 1), 0), this.drawColor).toString(16).padStart(2, "0");
            const color = "#" + preColor + preColor + preColor;
            // Отрисовка
            context.fillStyle = color;
            context.fillRect(x, y, x + 1, y + 1);
          })
        )
        .subscribe(
          VoidFunctionVar,
          VoidFunctionVar,
          () => {
            this.inProgress = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
