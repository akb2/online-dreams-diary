import { DreamDefHeight, DreamMapSize, DreamTerrain } from "@_datas/dream-map-settings";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { Injectable } from "@angular/core";





@Injectable()

export class Ceil3dService {

  dreamMap: DreamMap;





  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    if (this.isBorderCeil(x, y)) {
      return this.getBorderCeil(x, y);
    }
    // Обычная ячейка
    else if (!!this.dreamMap?.ceils?.filter(c => c.coord.x === x && c.coord.y === y)?.length) {
      return this.dreamMap.ceils.find(c => c.coord.x === x && c.coord.y === y);
    }
    // Новая ячейка
    const ceil: DreamMapCeil = this.getDefaultCeil(x, y);
    // Сохранить ячейку
    this.dreamMap.ceils.push(ceil);
    // Вернуть ячейку
    return ceil;
  }

  // Ячейка по умолчанию
  getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: {
        x,
        y,
        z: DreamDefHeight,
        originalZ: DreamDefHeight
      }
    };
  }

  // Приграничная яейка
  private getBorderCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: {
        x,
        y,
        z: DreamDefHeight,
        originalZ: DreamDefHeight
      }
    };
  }

  // Приграничная ячейка
  private isBorderCeil(x: number, y: number): boolean {
    const width: number = this.dreamMap?.size?.width ?? DreamMapSize;
    const height: number = this.dreamMap?.size?.height ?? DreamMapSize;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }
}
