import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, Self } from "@angular/core";
import { NgControl } from "@angular/forms";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { ParseInt } from "@_helpers/math";
import { OptionData } from "@_models/form";





@Component({
  selector: "app-slider-input",
  templateUrl: "./slider-input.component.html",
  styleUrls: ["./slider-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SliderInputComponent extends BaseInputDirective {


  @Input() min: number = 0;
  @Input() max: number = 10;
  @Input() step: number = 1;
  @Input() iconColorized: boolean = true;
  @Input() optionData: OptionData[] = [];





  // Слайдер по массиву значений
  get isAnOptionDataList(): boolean {
    return !!this.optionData?.length;
  }

  // Минимальное значение
  get getMinValue(): number {
    return this.isAnOptionDataList ? 0 : this.min;
  }

  // Максимальное значение
  get getMaxValue(): number {
    return this.isAnOptionDataList ? this.optionData.length - 1 : this.max;
  }

  // Шаг сдвига
  get getStep(): number {
    return this.isAnOptionDataList ? 1 : this.step;
  }

  // Текущее значение
  get getValue(): number {
    const tempValue: number = ParseInt(this.control?.value);
    // Вернуть значение
    return this.isAnOptionDataList ?
      (this.optionData.findIndex(({ key }) => key === tempValue.toString())) :
      tempValue;
  }

  // Значение для отображения
  get getDisplayValue(): string {
    const tempValue: number = this.getValue;
    // Вернуть подпись
    return this.isAnOptionDataList ?
      (this.optionData[tempValue]?.title ?? "") :
      tempValue.toString();
  }





  constructor(
    @Optional() @Self() override controlDir: NgControl,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir);
  }





  // Изменение значения
  onValueChange(event: number): void {
    if (this.isAnOptionDataList) {
      this.control.setValue(ParseInt(this.optionData[event].key));
      this.changeDetectorRef.detectChanges();
    }
  }
}
