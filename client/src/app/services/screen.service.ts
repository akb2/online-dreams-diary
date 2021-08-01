import { Injectable } from "@angular/core";





@Injectable({
  providedIn: "root"
})





export class ScreenService {


  private breakpoints: ScreenBreakpoints = {
    default: 0,
    xsmall: 600,
    small: 900,
    middle: 1200,
    large: 1800,
    xlarge: 10000
  };





  // Конструктор
  constructor() { }





  // Определить брейкпоинт
  public getBreakpoint(resolution: number): string {
    let breakpoint: string = "default";

    for (let key in this.breakpoints) {
      breakpoint = this.getMin(key) < resolution && this.getMax(key) >= resolution ? key : breakpoint;
    }

    return breakpoint;
  }

  // Минимальное разрешение
  public getMin(screen: string): number {
    let result = this.breakpoints.default;
    let test = this.getMax(screen);

    for (let key in this.breakpoints) {
      let resolution: number = this.breakpoints[key];
      result = result < resolution && test > resolution ? resolution : result;
    }

    return result;
  }

  // Максимальное разрешение
  public getMax(screen: string): number {
    return this.breakpoints[screen] ? this.breakpoints[screen] : this.breakpoints.default;
  }
}





// Ключи названий экранов
export type ScreenKeys = "default" | "xsmall" | "small" | "middle" | "large" | "xlarge";

// Тип данных для размеров экрана
export interface ScreenBreakpoints {
  default: number;
  xsmall: number;
  small: number;
  middle: number;
  large: number;
  xlarge: number;
}
