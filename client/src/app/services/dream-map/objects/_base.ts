import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
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
  dreamMapSettings: DreamMapSettings;





  // Получение объекта
  abstract getObject(): MapObject | MapObject[];

  // Обновление высоты
  abstract updateHeight(objectSetting: ObjectSetting): void;

  // Получение подтипа
  static getSubType(ceil?: DreamMapCeil, neighboringCeils?: ClosestHeights, type?: string, subType?: string): string {
    return "";
  }





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ) {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementTexture = displacementTexture;
    this.neighboringCeils = neighboringCeils;
    this.dreamMapSettings = dreamMapSettings;
  }

  // Обновить сведения уже существующего сервиса
  updateDatas(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ): DreamMapObjectTemplate {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementTexture = displacementTexture;
    this.neighboringCeils = neighboringCeils;
    this.dreamMapSettings = dreamMapSettings;
    // Вернуть экземпляр
    return this;
  }

  // Очистка памяти
  abstract destroy(): void;





  // Анимация
  abstract animate(): void;
}
