import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { DreamMapCeil, MapTerrain } from "@_models/dream";





@Component({
  selector: "app-dream-map-terrain",
  templateUrl: "./terrain.component.html",
  styleUrls: ["./terrain.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamMapTerrainComponent {


  @Input() ceil: DreamMapCeil;
  @Input() maxFog: number = 0;
  @Input() fog: number = 0;
  @Input() rotate: number = 0;

  @Input() rotateX: number = 0;
  @Input() rotateZ: number = 0;

  @Input() topCeil: DreamMapCeil | null;
  @Input() rightCeil: DreamMapCeil | null;
  @Input() bottomCeil: DreamMapCeil | null;
  @Input() leftCeil: DreamMapCeil | null;

  @Input() centerX: number = 0;
  @Input() centerY: number = 0;

  wallTypes: WallTypeInterface[] = Object.keys(WallType).filter(k => k.length > 1).map(value => ({ key: WallType[value], value }));





  canRender(side: WallType): boolean {
    // Показывать переднюю стенку
    if (side === WallType.front) {
      if (((this.rotateX > 270 || this.rotateX < 90) && this.bottomCeil === null) || (this.bottomCeil !== null && this.bottomCeil.coord.z < this.ceil.coord.z)) {
        return true;
      }
    }
    // Показывать правую стенку
    else if (side === WallType.right) {
      if (((this.rotateX > 0 && this.rotateX < 180) && this.rightCeil === null) || (this.rightCeil !== null && this.rightCeil.coord.z < this.ceil.coord.z)) {
        return true;
      }
    }
    // Показывать заднюю стенку
    else if (side === WallType.side) {
      if (((this.rotateX > 90 && this.rotateX < 270) && this.topCeil === null) || (this.topCeil !== null && this.topCeil.coord.z < this.ceil.coord.z)) {
        return true;
      }
    }
    // Показывать левую стенку
    else if (side === WallType.left) {
      if (((this.rotateX > 180 && this.rotateX < 360) && this.leftCeil === null) || (this.leftCeil !== null && this.leftCeil.coord.z < this.ceil.coord.z)) {
        return true;
      }
    }
    // Скрыть
    return false;
  }

  closestZ(side: WallType): number {
    if (this.canRender(side)) {
      // Показывать переднюю стенку
      if (side === WallType.front && this.bottomCeil) {
        return this.bottomCeil.coord.z;
      }
      // Показывать правую стенку
      else if (side === WallType.right && this.rightCeil) {
        return this.rightCeil.coord.z;
      }
      // Показывать правую стенку
      else if (side === WallType.side && this.topCeil) {
        return this.topCeil.coord.z;
      }
      // Показывать левую стенку
      else if (side === WallType.left && this.leftCeil) {
        return this.leftCeil.coord.z;
      }
    }
    // Скрыть
    return 0;
  }
}





// Перечисление стороны объекта
export enum WallType { side, left, right, front };

// Интерфейс типа стороны для массива
interface WallTypeInterface {
  key: WallType;
  value: string;
}

// Перечисления типов местности
export const MapTerrains: MapTerrain[] = ([
  {
    id: 1,
    name: "Трава"
  }
]).map(t => ({
  ...t
}));