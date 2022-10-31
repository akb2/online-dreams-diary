import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { MapObject } from "@_services/dream-map/object.service";
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
