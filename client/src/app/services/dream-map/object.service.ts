import { Injectable, OnDestroy } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { DreamMapObject, DreamMapObjects, MapObject, ObjectControllerParams, ObjectControllers, ObjectSetting, ObjectStaticSubTypeControllers } from "@_models/dream-map-objects";
import { DreamTerrain } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { Clock, DataTexture, Mesh } from "three";





@Injectable()

export class DreamMapObjectService implements OnDestroy {

  private emptyControllers: CustomObjectKey<number, CustomObjectKey<string, DreamMapObjectTemplate>> = {};
  private objectControllers: CustomObjectKey<number, CustomObjectKey<string, DreamMapObjectTemplate>> = {};





  // Получение объекта
  getObject(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    displacementTexture: DataTexture,
    closestsCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings,
    getDefault: boolean = true
  ): (MapObject | MapObject[])[] {
    const objects: (MapObject | MapObject[])[] = [];
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementTexture, closestsCeils, dreamMapSettings];
    let useDefault: boolean = true;
    // Требуется объект
    if (!!objectId) {
      const objectData: DreamMapObject = DreamMapObjects.find(({ id }) => id === objectId)!;
      // Объект найден
      if (!!objectData) {
        const controller: DreamMapObjectTemplate[] = !!this.objectControllers[objectId] ?
          Object.values(this.objectControllers[objectId]).map(c => c.updateDatas(...params)) :
          objectData.controllers.map(c => new c(...params));
        const mixedObject: (MapObject | MapObject[])[] = controller
          .map(c => ([c, c.getObject()]))
          .map(([c, objects]) => {
            (Array.isArray(objects) ? objects : [objects as MapObject]).map(object => {
              this.objectControllers[objectId] = this.objectControllers[objectId] ?? {};
              this.objectControllers[objectId][object.type] = c as DreamMapObjectTemplate;
            });
            // Вернуть объекты
            return objects as MapObject | MapObject[];
          });
        // Обновить данные
        objects.push(...mixedObject);
        useDefault = !!objectData.settings?.mixWithDefault;
      }
    }
    // Требуется пустой объект
    if ((useDefault || !objectId) && ObjectControllers[terrainId] && getDefault) {
      const controller: DreamMapObjectTemplate[] = !!this.emptyControllers[terrainId] ?
        Object.values(this.emptyControllers[terrainId]).map(c => c.updateDatas(...params)) :
        ObjectControllers[terrainId].map(c => new c(...params));
      const mixedObject: (MapObject | MapObject[])[] = controller
        .map(c => ([c, c.getObject()]))
        .map(([c, cs]) => {
          const objects: MapObject | MapObject[] = Array.isArray(cs) ?
            cs.map(c => ({ ...c, isDefault: true } as MapObject)) :
            ({ ...cs, isDefault: true } as MapObject);
          // Запомнить контроллеры
          (Array.isArray(objects) ? objects : [objects]).map(object => {
            this.emptyControllers[terrainId] = this.emptyControllers[terrainId] ?? {};
            this.emptyControllers[terrainId][object.type] = c as DreamMapObjectTemplate;
          });
          // Вернуть объекты
          return objects;
        });
      // Обновить данные
      objects.push(...mixedObject);
    }
    // Вернуть объекты
    return objects;
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
    const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementTexture, closestsCeils, dreamMapSettings];
    const type: string = objectSetting.type;
    const isDefault: boolean = objectSetting.isDefault;
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId && !isDefault) {
      const objectData: DreamMapObject = DreamMapObjects.find(({ id }) => id === objectId)!;
      // Объект найден
      if (!!objectData && !!this.objectControllers[objectId] && !!this.objectControllers[objectId][type]) {
        this.objectControllers[objectId][type].updateDatas(...params);
        this.objectControllers[objectId][type].updateHeight(objectSetting);
      }
    }
    // Требуется пустой объект
    else if (isDefault && !!this.emptyControllers[terrainId] && !!this.emptyControllers[terrainId][type]) {
      this.emptyControllers[terrainId][type].updateDatas(...params);
      this.emptyControllers[terrainId][type].updateHeight(objectSetting);
    }
  }

  // Получение под типа
  getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string): string {
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    let useDefault: boolean = true;
    // Требуется объект
    if (!!objectId) {
      const objectData: DreamMapObject = DreamMapObjects.find(({ id }) => id === objectId)!;
      // Объект найден
      if (!!objectData && !!objectData.subTypeFunctions[type]) {
        return objectData.subTypeFunctions[type](ceil, neighboringCeils);
      }
    }
    // Требуется пустой объект
    if ((useDefault || !objectId) && !!ObjectStaticSubTypeControllers[terrainId] && !!ObjectStaticSubTypeControllers[terrainId][type]) {
      return ObjectStaticSubTypeControllers[terrainId][type](ceil, neighboringCeils);
    }
    // Вернуть пусто
    return "";
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService
  ) { }

  ngOnDestroy(): void {
    Object.values(this.emptyControllers).forEach(controllers => Object.values(controllers).filter(c => !!c).forEach(controller => controller.destroy()));
  }
}
