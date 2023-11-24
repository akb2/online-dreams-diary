import { CreateArray } from "@_datas/app";
import { Random } from "@_helpers/math";

export class PerlinNoiseGenerator {

  private gradient: [number, number][][];





  constructor(private gridSize: number) {
    this.gradient = CreateArray(this.gridSize).map(() => CreateArray(this.gridSize).map(() => {
      const angle = Random(0, 2 * Math.PI);
      // Значения
      return [Math.cos(angle), Math.sin(angle)];
    }));
  }





  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private grad(ix: number, iy: number, x: number, y: number): number {
    const dx = x - ix;
    const dy = y - iy;
    const gradient = this.gradient[ix % this.gridSize][iy % this.gridSize];
    return dx * gradient[0] + dy * gradient[1];
  }

  noise(x: number, y: number): number {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const gx0y0 = this.grad(floorX, floorY, x, y);
    const gx1y0 = this.grad(floorX + 1, floorY, x, y);
    const gx0y1 = this.grad(floorX, floorY + 1, x, y);
    const gx1y1 = this.grad(floorX + 1, floorY + 1, x, y);
    const s = this.fade((x - floorX));
    const t = this.fade((y - floorY));
    const nx0 = this.lerp(gx0y0, gx1y0, s);
    const nx1 = this.lerp(gx0y1, gx1y1, s);
    // Интерполируем между результатами по оси Y
    return this.lerp(nx0, nx1, t);
  }
}
