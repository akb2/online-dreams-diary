import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { MapObject } from "@_services/dream-map/object.service";
import { DreamDefHeight, DreamTerrain } from "@_services/dream.service";
import { Clock, Mesh } from "three";





// Образец класса для объекта
export abstract class DreamMapObjectTemplate {


  dreamMap: DreamMap;
  ceil: DreamMapCeil;
  terrain: Mesh;
  clock: Clock;
  alphaFogService: DreamMapAlphaFogService;
  displacementCanvas: HTMLCanvasElement;
  neighboringCeils: DreamMapCeil[];





  // Получение объекта
  abstract getObject(): MapObject;

  // Получить ячейку
  getCeil(x: number, y: number): DreamMapCeil {
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) || this.getDefaultCeil(x, y);
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





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[]
  ) {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementCanvas = displacementCanvas;
    this.neighboringCeils = neighboringCeils;
  }

  // Обновить сведения уже существующего сервиса
  abstract updateDatas(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[]
  ): DreamMapObjectTemplate;

  // Очистка памяти
  abstract destroy(): void;





  // Анимация
  abstract animate(): void;
}
