import { BaseInputDirective } from "@_directives/base-input.directive";
import { OptionData } from "@_models/form";
import { clamp, round } from "@akb2/math";
import { anyToFloat, anyToInt } from "@akb2/types-tools";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Optional, Self } from "@angular/core";
import { NgControl } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-slider-input",
  templateUrl: "./slider-input.component.html",
  styleUrls: ["./slider-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SliderInputComponent extends BaseInputDirective implements OnInit, OnDestroy {


  @Input() min: number = 0;
  @Input() max: number = 10;
  @Input() step: number = 1;
  @Input() iconColorized: boolean = true;
  @Input() optionData: OptionData[] = [];

  private destroyed$ = new Subject<void>();





  // Слайдер по массиву значений
  get isAnOptionDataList(): boolean {
    return !!this.optionData?.length;
  }

  // Минимальное значение
  get getMinValue(): number {
    return this.isAnOptionDataList
      ? 0
      : this.min;
  }

  // Максимальное значение
  get getMaxValue(): number {
    return this.isAnOptionDataList
      ? this.optionData.length - 1
      : this.max;
  }

  // Шаг сдвига
  get getStep(): number {
    return this.isAnOptionDataList
      ? 1
      : this.step;
  }

  // Количество десятичных разрядов
  private get getDecimalCount(): number {
    return anyToInt(this.step?.toString()?.split(/([\.,])/i)?.[1]?.length);
  }

  // Текущее значение
  get getValue(): number {
    const afterDotNum = this.getDecimalCount;
    const tempValue = clamp(anyToFloat(this.control?.value, 0, afterDotNum), this.getMaxValue, this.getMinValue);
    // Вернуть значение
    return this.isAnOptionDataList
      ? anyToInt(this.optionData?.findIndex(({ key }) => key === tempValue.toString()))
      : tempValue;
  }

  // Значение для отображения
  get getDisplayValue(): string {
    const tempValue = this.getValue;
    const afterDotNum = this.getDecimalCount;
    // Вернуть подпись
    return this.isAnOptionDataList
      ? (this.optionData?.[tempValue]?.title ?? "")
      : round(tempValue, afterDotNum).toFixed(afterDotNum);
  }





  constructor(
    @Optional() @Self() override controlDir: NgControl,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir);
  }

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.changeDetectorRef.detectChanges())
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Изменение значения
  onValueChange(event: Event | number): void {
    const afterDotNum = this.getDecimalCount;
    const mixedValue = typeof event === "number"
      ? event
      : (event.target as HTMLInputElement)?.value;
    const currentValue = this.getValue;
    const newValue = clamp(anyToFloat(mixedValue, 0, afterDotNum), this.getMaxValue, this.getMinValue);
    // Значения отличаются
    if (currentValue !== newValue) {
      if (this.isAnOptionDataList) {
        this.control.setValue(anyToInt(this.optionData[newValue].key));
        this.changeDetectorRef.detectChanges();
      }
      // Обычный слайдер
      else {
        this.control.setValue(newValue);
      }
    }
  }
}
