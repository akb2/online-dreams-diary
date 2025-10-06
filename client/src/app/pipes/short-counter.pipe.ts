import { CreateArray } from "@_datas/app";
import { round } from "@akb2/math";
import { anyToInt } from "@akb2/types-tools";
import { Pipe, PipeTransform } from "@angular/core";





@Pipe({
  name: "shortCounter"
})

export class ShortCounterPipe implements PipeTransform {

  private units: string[] = ["", "K", "M", "B"];
  private overflowLabel: string = "O_O";

  private groupNumber: number = 1000;





  transform(value: any): string {
    const digit: number = anyToInt(value);
    let result: string = "";
    // Ноль
    if (digit === 0) {
      result = digit?.toString();
    }
    // Цикл по разрядам
    CreateArray(this.units.length + 1).forEach(key => {
      const step: number = key + 1;
      const minValue: number = Math.pow(this.groupNumber, key);
      const maxValue: number = Math.pow(this.groupNumber, step);
      // Найден разряд
      if (digit >= minValue && digit < maxValue) {
        result = round(digit / minValue, 1) + this.units[key];
      }
    });
    // Разряд не найден
    if (!result?.length) {
      result = this.overflowLabel;
    }
    // Вернуть результат
    return result;
  }
}
