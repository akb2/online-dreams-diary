import { NativeDateAdapter } from "@angular/material/core";





export class CustomDateAdapter extends NativeDateAdapter {


  // Разобрать строку
  override parse(value: any): Date | null {
    if ((typeof value === 'string') && (value.indexOf('/') > -1)) {
      const str: string[] = value.split('/');

      const year: number = Number(str[2]);
      const month: number = Number(str[1]) - 1;
      const date: number = Number(str[0]);

      return new Date(year, month, date);
    }

    const timestamp: number = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }


  // Первый день недели
  override getFirstDayOfWeek(): number {
    return 1;
  }
}
