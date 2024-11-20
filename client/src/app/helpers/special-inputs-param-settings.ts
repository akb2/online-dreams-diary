import { CreateArray } from "@_datas/app";

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
    const angle = this.angles[fullCircle ? 1 : 0];
    const koof = fullCircle ? 0 : 1;
    // Обновить данные
    this.serifItterator = CreateArray((angle / this.step) + koof);
    this.largeSerifItterator = CreateArray((angle / this.largeStep) + koof);
  }
}
