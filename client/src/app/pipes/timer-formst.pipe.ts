import { ParseInt } from "@_helpers/math";
import { ArrayFilter } from "@_helpers/objects";
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "timerFormat"
})
export class TimerFormatPipe implements PipeTransform {
  transform(value: any): string {
    const time = ParseInt(value);
    // Преобразование числа во время
    if (time > 0) {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = value % 60;
      const hoursString = hours > 0
        ? hours.toString().padStart(2, "0")
        : "";
      const minutesString = minutes.toString().padStart(2, "0");
      const secondsString = seconds.toString().padStart(2, "0");
      // Вывод времени в формате ЧЧ:ММ:СС
      return ArrayFilter([hoursString, minutesString, secondsString], Boolean, false).join(":");
    }
    // Вывод времени в формате 00:00:00
    return "00:00";
  }
}
