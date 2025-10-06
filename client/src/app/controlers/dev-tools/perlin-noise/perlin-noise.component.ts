import { VoidFunctionVar } from "@_datas/app";
import { PerlinNoiseGenerator } from "@_datas/three.js/helpers/perlin-noise-generator";
import { Average, AverageGeometric, AverageHarmonic, AverageMax, AverageMedian, AverageMin, AverageMode, AverageMultiply, AveragePower, AverageQuadratic, LineFunc } from "@_helpers/math";
import { GetCoordsByIndex } from "@_helpers/objects";
import { TakeCycle } from "@_helpers/rxjs";
import { OptionData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { clamp, round } from "@akb2/math";
import { anyToInt } from "@akb2/types-tools";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject, map, takeUntil, tap } from "rxjs";





@Component({
  selector: "dev-perlin-noise",
  templateUrl: "./perlin-noise.component.html",
  styleUrls: ["perlin-noise.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PerlinNoiseComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("canvas", { read: ElementRef }) canvas: ElementRef<HTMLCanvasElement>;

  navMenuType: NavMenuType.short;

  size = 300;
  inProgress = false;

  form: FormGroup;

  noiseLargeScale: MinMaxStepDefault = [40, 100, 1, 50];
  noiseMiddleScale: MinMaxStepDefault = [20, 39, 1, 25];
  noiseSmallScale: MinMaxStepDefault = [1.1, 19.9, 0.1, 6];
  colorRange: MinMaxStepRangeDefault = [0, 255, 0.1, 0, 255];
  mixTypes: OptionData[] = MixTypes;

  private updateColorMax = true;
  private updateColorMin = true;

  private maxNoise = 1;
  private minNoise = -1;

  private destroyed$ = new Subject<void>();





  // Получить HEX цвет
  private getHexColor(value: number): string {
    const preColor = clamp(round(value, 0), this.colorRange[1], this.colorRange[0]).toString(16).padStart(2, "0");
    // Вернуть цвет
    return "#" + preColor + preColor + preColor;
  }

  // Цвет минимальной высоты
  get getMinColor(): string {
    return this.getHexColor(anyToInt(this.form?.get("colorMinRange")?.value));
  }

  // Цвет максимальной высоты
  get getMaxColor(): string {
    return this.getHexColor(anyToInt(this.form?.get("colorMaxRange")?.value));
  }

  // Смешение
  private getMixedValue(values: number[]): number {
    const mixType: MixType = (this.form.get("mixType")?.value ?? "") as MixType;
    // Наименьшее
    if (mixType === MixType.min) {
      return AverageMin(values);
    }
    // Наибольшее
    else if (mixType === MixType.max) {
      return AverageMax(values);
    }
    // Среднее геометрическое
    else if (mixType === MixType.geometricAverage) {
      return AverageGeometric(values);
    }
    // Среднее гармоническое
    else if (mixType === MixType.harmonicAverage) {
      return AverageHarmonic(values);
    }
    // Медиана
    else if (mixType === MixType.median) {
      return AverageMedian(values);
    }
    // Мода
    else if (mixType === MixType.mode) {
      return AverageMode(values);
    }
    // Среднее квадратичное
    else if (mixType === MixType.quadraticMean) {
      return AverageQuadratic(values);
    }
    //Умножение
    else if (mixType === MixType.multiply) {
      return AverageMultiply(this.minNoise, this.maxNoise, values);
    }
    //Умножение
    else if (mixType === MixType.power) {
      return AveragePower(12, values);
    }
    // Среднее арифметическое
    return Average(values);
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      mixType: [MixType.power],
      useLargeNoise: [true],
      useMiddleNoise: [true],
      useSmallNoise: [true],
      largeScale: [this.noiseLargeScale[3]],
      middleScale: [this.noiseMiddleScale[3]],
      smallScale: [this.noiseSmallScale[3]],
      colorMinRange: [this.colorRange[3]],
      colorMaxRange: [this.colorRange[4]]
    });
  }

  ngOnInit(): void {
    this.colorMinRangeListener();
    this.colorMaxRangeListener();
  }

  ngAfterViewInit() {
    if (!!this.canvas?.nativeElement) {
      this.onGenerate();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Генерация
  onGenerate(): void {
    if (!this.inProgress) {
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext("2d");
      const perlinNoise = new PerlinNoiseGenerator(this.size);
      const noiseLargeScale = anyToInt(this.form?.get("largeScale")?.value, this.noiseLargeScale[3]);
      const noiseMiddleScale = anyToInt(this.form?.get("middleScale")?.value, this.noiseMiddleScale[3]);
      const noiseSmallScale = anyToInt(this.form?.get("smallScale")?.value, this.noiseSmallScale[3]);
      // Отметка о начале
      this.inProgress = true;
      this.changeDetectorRef.detectChanges();
      // Очистка поля
      context.clearRect(0, 0, this.size, this.size);
      // Отрисовка
      TakeCycle(this.size * this.size, 10000)
        .pipe(
          takeUntil(this.destroyed$),
          map(i => GetCoordsByIndex(this.size, this.size, i)),
          tap(({ x, y }) => {
            const noises: number[] = [];
            const maxColor = anyToInt(this.form.get("colorMaxRange").value, this.colorRange[1]);
            const minColor = anyToInt(this.form.get("colorMinRange").value, this.colorRange[0]);
            // Большой шум
            if (!!this.form?.get("useLargeNoise")?.value) {
              noises.push(perlinNoise.noise(x / noiseLargeScale, y / noiseLargeScale));
            }
            // Средний шум
            if (!!this.form?.get("useMiddleNoise")?.value) {
              noises.push(perlinNoise.noise(x / noiseMiddleScale, y / noiseMiddleScale));
            }
            // Маленький шум
            if (!!this.form?.get("useSmallNoise")?.value) {
              noises.push(perlinNoise.noise(x / noiseSmallScale, y / noiseSmallScale));
            }
            // Данные
            const noise = this.getMixedValue(noises);
            const color = this.getHexColor(clamp(LineFunc(minColor, maxColor, noise, this.minNoise, this.maxNoise), maxColor, minColor));
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





  // Прослушивание минимального цвета
  private colorMinRangeListener(): void {
    this.form?.get("colorMinRange")?.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(minValue => {
        if (this.updateColorMax) {
          const maxControl = this.form.get("colorMaxRange");
          const maxValue = maxControl.value;
          // Блокировать бесконечный цикл
          this.updateColorMax = false;
          // Изменить максимальное значение
          maxControl.setValue(clamp(maxValue, this.colorRange[1], minValue));
          // Обновить
          this.changeDetectorRef.detectChanges();
        }
        // Сброс
        this.updateColorMin = true;
      });
  }

  // Прослушивание максимального цвета
  private colorMaxRangeListener(): void {
    this.form?.get("colorMaxRange")?.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(maxValue => {
        if (this.updateColorMin) {
          const minControl = this.form.get("colorMinRange");
          const minValue = minControl.value;
          // Блокировать бесконечный цикл
          this.updateColorMin = false;
          // Изменить максимальное значение
          minControl.setValue(clamp(minValue, maxValue, this.colorRange[0]));
          // Обновить
          this.changeDetectorRef.detectChanges();
        }
        // Сброс
        this.updateColorMax = true;
      });
  }
}





type MinMaxStepDefault = [number, number, number, number];
type MinMaxStepRangeDefault = [...MinMaxStepDefault, number];

enum MixType {
  average = "average",
  geometricAverage = "geometricAverage",
  harmonicAverage = "harmonicAverage",
  quadraticMean = "quadraticMean",
  power = "power",
  multiply = "multiply",
  median = "median",
  mode = "mode",
  min = "min",
  max = "max"
}





const MixTypes: OptionData[] = Object.values(MixType).map(key => ({
  key,
  title: "pages.dev_tools.noise_generator.labels.mix_types." + key
}));
