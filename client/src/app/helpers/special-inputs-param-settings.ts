import { CreateArray } from "@_datas/app";

export class LineParamSetting {
  serifItterator: number[];
  largeSerifItterator: number[];

  constructor(
    public step = 1,
    public largeStep = 10,
    public showSerifs = true,
    public showLargeSerifs = true,
    public maxValue = 100,
    public minValue = 0,
  ) {
    const size = this.maxValue - this.minValue;
    // Обновить данные
    this.serifItterator = CreateArray((size / this.step) + 1);
    this.largeSerifItterator = CreateArray((size / this.largeStep) + 1);
  }
}

export class CircleParamSetting {
  private angles: [number, number] = [180, 360];

  serifItterator: number[];
  largeSerifItterator: number[];

  constructor(
    public step: number,
    public largeStep: number = 90,
    public fullCircle: boolean = false,
    public showSerifs = true,
    public showLargeSerifs = true
  ) {
    const key = fullCircle
      ? 1
      : 0
    const angle = this.angles[key];
    const koof = 1 - key;
    // Обновить данные
    this.serifItterator = CreateArray((angle / this.step) + koof);
    this.largeSerifItterator = CreateArray((angle / this.largeStep) + koof);
  }
}
