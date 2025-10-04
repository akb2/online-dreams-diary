import { DreamMapDefaultShadowQuality, DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { Average } from "@_helpers/math";
import { DreamMapSettings } from "@_models/dream-map";
import { clamp } from "@akb2/math";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})

export class Settings3DService {
  readonly ceilSize = 1;
  readonly ceilParts = 64;
  readonly skyTime = 180; //?  0 - 360
  readonly minHeight = 0;
  readonly startHeight = this.minHeight;
  readonly worldOceanFlowSpeed = this.ceilSize * 4;
  readonly cameraMinZoom = this.ceilSize;
  readonly terrain = 1;
  readonly outsideSize = 1;
  readonly shadowQualitySize = 1024;
  readonly mapMinShadowQuality = 1;
  readonly mapMaxShadowQuality = 7;

  private readonly defaultMapSize = 50;
  private readonly defaultHeight = -1;
  private readonly ceilWaterParts = 1;
  private readonly skyType = 1;
  private readonly baseElmsCount = 128;
  private readonly mapDefaultShadowQuality = 2;
  private readonly defaultTitle = "*** Новое сновидение ***";
  private readonly defaultDescription = "*** Без описания ***";

  mapSize: number;
  height: number;
  fullMapSize: number;
  maxHeight: number;
  realMaxHeight: number;
  waterDefaultHeight: number;
  cloudsDefaultHeight: number;
  cameraMaxZoom: number;
  fogFar: number;
  fogNear: number;
  horizont: number;

  private cloudsMinHeight: number;
  private cloudsMaxHeight: number;
  private lodMaxDistance: number;

  readonly settings: DreamMapSettings = {
    detalization: DreamObjectElmsValues.Middle,
    shadowQuality: DreamMapDefaultShadowQuality,
  };



  // Максимальное число элементов в ячейке
  maxElmsCount(d: DreamObjectElmsValues) {
    return this.baseElmsCount * (d + 1);
  }



  // Установить размер карты
  setMapSize(width = this.defaultMapSize, height = this.defaultMapSize, zHeight = this.defaultHeight) {
    this.mapSize = Math.min(width, height);
    this.height = zHeight;
    this.fullMapSize = this.mapSize * ((this.outsideSize * 2) + 1);
    this.maxHeight = (this.mapSize / 2) * this.ceilParts * this.ceilSize;
    this.realMaxHeight = this.maxHeight / this.ceilParts;
    this.waterDefaultHeight = (this.maxHeight / 2) - (this.ceilSize / this.ceilParts);
    this.cloudsMinHeight = 0.7 * this.realMaxHeight;
    this.cloudsMaxHeight = 1.2 * this.realMaxHeight;
    this.cloudsDefaultHeight = clamp(0.9 * this.realMaxHeight, this.cloudsMaxHeight, this.cloudsMinHeight);
    this.cameraMaxZoom = this.realMaxHeight;
    this.fogFar = this.mapSize * this.ceilSize;
    this.fogNear = 0.7 * this.fogFar;
    this.horizont = this.fogNear * 3;
    this.lodMaxDistance = Average([this.fogFar, this.fogNear]);
  }



  constructor() {
    this.setMapSize();
  }
}
