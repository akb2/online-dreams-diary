import { Injectable, OnDestroy } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, ObjectControllerParams, ObjectControllers, ObjectStaticSubTypeControllers, XYCoord } from "@_models/dream-map";
import { DreamTerrain } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { BufferGeometry, Clock, Color, Material, Matrix4, Mesh } from "three";





@Injectable()

export class DreamMapObjectService implements OnDestroy {

  private controllers: CustomObjectKey<number, DreamMapObjectTemplate> = {};





  // получение объекта
  getObject(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    displacementCanvas: HTMLCanvasElement,
    closestsCeils: ClosestHeights
  ): MapObject | MapObject[] {
    // Свойства
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && ObjectControllers[terrainId]) {
      const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementCanvas, closestsCeils];
      const controller: DreamMapObjectTemplate = !!this.controllers[terrainId] ?
        this.controllers[terrainId].updateDatas(...params) :
        new ObjectControllers[terrainId](...params);
      const object: MapObject | MapObject[] = controller.getObject();
      // Обновить данные
      this.controllers[terrainId] = controller;
      // Вернуть группу
      return object;
    }
    // Объект не требуется
    return null;
  }

  // Получение под типа
  getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights): string {
    // Свойства
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && ObjectStaticSubTypeControllers[terrainId]) {
      return ObjectStaticSubTypeControllers[terrainId](ceil, neighboringCeils);
    }
    // Вернуть пусто
    return "";
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService
  ) { }

  ngOnDestroy(): void {
    Object.values(this.controllers).forEach(controller => controller.destroy());
  }
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
