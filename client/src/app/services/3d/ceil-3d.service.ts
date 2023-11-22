import { DreamMapSectors } from "@_datas/dream-map";
import { DreamDefHeight, DreamTerrain } from "@_datas/dream-map-settings";
import { DreamMap, DreamMapCeil, DreamMapSector, UVCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { Injectable } from "@angular/core";





@Injectable()

export class Ceil3dService {

  dreamMap: DreamMap;

  private sectorBorders: number = 5;





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
    if (this.isBorderCeil(x, y)) {
      return this.getBorderCeil(x, y);
    }
    // Обычная ячейка
    else {
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
  isBorderCeil(x: number, y: number): boolean {
    const width: number = this.dreamMap.size.width;
    const height: number = this.dreamMap.size.height;
    // Проверка
    return x < 0 || y < 0 || x >= width || y >= height;
  }

  // Граница между секторами
  isBorderSectorCeil(x: number, y: number): boolean {
    const width: number = this.dreamMap.size.width;
    const height: number = this.dreamMap.size.height;
    // Проверка
    return (
      (x >= -this.sectorBorders && x < this.sectorBorders)
      || (x >= width - this.sectorBorders && x < width + this.sectorBorders)
      || (y >= -this.sectorBorders && y < this.sectorBorders)
      || (y >= height - this.sectorBorders && y < height + this.sectorBorders)
    );
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
    const width: number = this.dreamMap.size.width / 2;
    const height: number = this.dreamMap.size.height / 2;
    const nX: number = x / width;
    const nY: number = y / height;
    const u: number = nX * Math.sqrt(1 - ((nY * nY) / 2));
    const v: number = nY * Math.sqrt(1 - ((nX * nX) / 2));
    // Вернуть объект
    return { u, v };
  }
}
