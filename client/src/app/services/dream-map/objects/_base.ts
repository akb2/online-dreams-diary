import { ClosestHeights, DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { MapObject, ObjectSetting } from "@_services/dream-map/object.service";
import { Clock, DataTexture, Mesh } from "three";





// Образец класса для объекта
export abstract class DreamMapObjectTemplate {


  dreamMap: DreamMap;
  ceil: DreamMapCeil;
  terrain: Mesh;
  clock: Clock;
  alphaFogService: DreamMapAlphaFogService;
  displacementTexture: DataTexture;
  neighboringCeils: ClosestHeights;





  // Получение объекта
  abstract getObject(): MapObject | MapObject[];

  // Обновление высоты
  abstract updateHeight(objectSetting: ObjectSetting): void;

  // Получение подтипа
  static getSubType(ceil?: DreamMapCeil, neighboringCeils?: ClosestHeights): string {
    return "";
  }





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights
  ) {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementTexture = displacementTexture;
    this.neighboringCeils = neighboringCeils;
  }

  // Обновить сведения уже существующего сервиса
  abstract updateDatas(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights
  ): DreamMapObjectTemplate;

  // Очистка памяти
  abstract destroy(): void;





  // Анимация
  abstract animate(): void;
}
