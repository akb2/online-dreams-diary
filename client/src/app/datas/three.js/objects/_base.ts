import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamMapAlphaFogService } from "@_services/three.js/alphaFog.service";
import { Clock, DataTexture, Mesh, PlaneGeometry, Ray, Triangle, Vector3 } from "three";
import { CreateTerrainTriangles } from "./_functions";
import { BaseObjectControllerParams, CreateTerrainTrianglesObject } from "./_models";





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

  // Получение подтипа
  static getSubType(ceil?: DreamMapCeil, neighboringCeils?: ClosestHeights, type: string = "", subType: string = ""): string {
    return subType;
  }

  // Получение параметров рельефа
  createTerrainTriangles(): CreateTerrainTrianglesObject {
    return CreateTerrainTriangles(this.terrain.geometry as PlaneGeometry, this.ceil.coord.x, this.ceil.coord.y);
  }

  // Создание вспомогательных объектов
  createParamsHelpers(): BaseObjectControllerParams {
    const triangle: Triangle = new Triangle();
    const v1: Vector3 = new Vector3();
    const v2: Vector3 = new Vector3();
    const dir = new Vector3();
    const ray: Ray = new Ray();
    const intersect: Vector3 = new Vector3();
    // Вернуть объект
    return { v1, v2, dir, ray, intersect, triangle };
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

  // Обновление высоты
  abstract updateHeight(objectSetting: ObjectSetting): void;

  // Очистка памяти
  abstract destroy(): void;





  // Анимация
  abstract animate(): void;
}
