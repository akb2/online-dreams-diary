import { DreamMapSectors, MapTerrains } from "@_datas/dream-map";
import { ArrayFind } from "@_helpers/objects";
import { DreamMap, DreamMapCeil, DreamMapSector, MapTerrain, UVCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { Injectable } from "@angular/core";
import { Settings3DService } from "./settings-3d.service";

@Injectable()

export class Ceil3dService {

  dreamMap: DreamMap;



  // Расположение внутри сектора
  private sectorDimension(value: number, size: number): NumberDirection {
    return value < 0
      ? -1
      : value >= size
        ? 1
        : 0;
  }

  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    if (!this.isBorderCeil(x, y)) {
      let index = this.dreamMap.ceils.findIndex(c => c.coord.x === x && c.coord.y === y);
      // Яейки не существует
      if (index < 0) {
        const ceil: DreamMapCeil = this.getDefaultCeil(x, y);
        // Новый индекс
        index = this.dreamMap.ceils.length;
        // Сохранить ячейку
        this.dreamMap.ceils.push(ceil);
      }
      // Вернуть ячейку
      return this.dreamMap.ceils[index];
    }
    // Ячейка за пределами редактируемой области
    return this.getBorderCeil(x, y);
  }

  // Ячейка по умолчанию
  private getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: this.settings3DService.terrain,
      object: null,
      coord: {
        x,
        y,
        z: this.settings3DService.height,
        originalZ: this.settings3DService.height
      }
    };
  }

  // Приграничная яейка
  private getBorderCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: this.settings3DService.terrain,
      object: null,
      coord: {
        x,
        y,
        z: this.settings3DService.height,
        originalZ: this.settings3DService.height
      }
    };
  }

  // Приграничная ячейка
  isBorderCeil(x: number, y: number): boolean {
    const width: number = this.dreamMap.size.width;
    const height: number = this.dreamMap.size.height;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }

  // Сектор ячейки на карте
  getSectorByCoords(x: number, y: number): DreamMapSector {
    const xDimension: NumberDirection = this.sectorDimension(x, this.dreamMap.size.width);
    const yDimension: NumberDirection = this.sectorDimension(y, this.dreamMap.size.height);
    // Вернуть сектор
    return DreamMapSectors[yDimension][xDimension];
  }

  // Перевести координаты в круговые координаты
  coordsToUV(x: number, y: number): UVCoord {
    const width: number = this.dreamMap.size.width / 2 * this.settings3DService.ceilSize;
    const height: number = this.dreamMap.size.height / 2 * this.settings3DService.ceilSize;
    const nX: number = x / width;
    const nY: number = y / height;
    const u: number = nX * Math.sqrt(1 - ((nY * nY) / 2));
    const v: number = nY * Math.sqrt(1 - ((nX * nX) / 2));
    // Вернуть объект
    return { u, v };
  }

  // Получить данные о местности
  getTerrain(x: number, y: number): MapTerrain {
    const ceil: DreamMapCeil = this.getCeil(x, y);
    // Вернуть данные
    return ArrayFind(MapTerrains, ({ id }) => id === ceil.terrain) ?? MapTerrains.find(({ id }) => id === 1);
  }



  constructor(
    private settings3DService: Settings3DService
  ) { }
}
