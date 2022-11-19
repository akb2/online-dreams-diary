import { Injectable, OnDestroy } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings, ObjectControllerParams, ObjectControllers, ObjectStaticSubTypeControllers, XYCoord } from "@_models/dream-map";
import { DreamTerrain } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { BufferGeometry, Clock, Color, DataTexture, InstancedMesh, Material, Matrix4, Mesh } from "three";





@Injectable()

export class DreamMapObjectService implements OnDestroy {

  private controllers: CustomObjectKey<number, DreamMapObjectTemplate[]> = {};





  // Получение объекта
  getObject(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    displacementTexture: DataTexture,
    closestsCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ): (MapObject | MapObject[])[] {
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && ObjectControllers[terrainId]) {
      const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementTexture, closestsCeils, dreamMapSettings];
      const controller: DreamMapObjectTemplate[] = !!this.controllers[terrainId] ?
        this.controllers[terrainId].map(c => c.updateDatas(...params)) :
        ObjectControllers[terrainId].map(c => new c(...params));
      const object: (MapObject | MapObject[])[] = controller.map(c => c.getObject());
      // Обновить данные
      this.controllers[terrainId] = controller;
      // Вернуть группу
      return object;
    }
    // Объект не требуется
    return null;
  }

  // Обновить позицию по оси Z
  updateHeight(
    objectSetting: ObjectSetting,
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    displacementTexture: DataTexture,
    closestsCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings,
  ): void {
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && ObjectControllers[terrainId]) {
      const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementTexture, closestsCeils, dreamMapSettings];
      // Обновить данные
      this.controllers[terrainId].forEach(c => {
        c.updateDatas(...params);
        c.updateHeight(objectSetting);
      });
    }
  }

  // Получение под типа
  getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string): string {
    // Свойства
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && !!ObjectStaticSubTypeControllers[terrainId] && !!ObjectStaticSubTypeControllers[terrainId][type]) {
      return ObjectStaticSubTypeControllers[terrainId][type](ceil, neighboringCeils);
    }
    // Вернуть пусто
    return "";
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService
  ) { }

  ngOnDestroy(): void {
    Object.values(this.controllers).forEach(controllers => controllers.forEach(controller => controller.destroy()));
  }
}





// Интерфейс данных объекта
export interface ObjectSetting {
  coords: XYCoord;
  mesh: InstancedMesh;
  type: string;
  subType: string;
  indexKeys: number[];
  count: number;
}

// Тип ответа
export interface MapObject {
  matrix: Matrix4[];
  color: Color[];
  geometry: BufferGeometry;
  material: Material;
  type: string;
  subType: string;
  coords: XYCoord;
  count: number;
  castShadow: boolean;
  recieveShadow: boolean;
  animate?: Function;
};
