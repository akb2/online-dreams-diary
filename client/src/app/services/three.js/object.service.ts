import { ObjectControllers, ObjectStaticSubTypeControllers } from "@_datas/dream-map-objects";
import { DreamTerrain } from "@_datas/dream-map-settings";
import { DreamMapObjectTemplate } from "@_datas/three.js/objects/_base";
import { GetDreamMapObjectByID } from "@_datas/three.js/objects/_functions";
import { ArrayFilter } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { DreamMapObject, MapObject, ObjectControllerParams, ObjectSetting } from "@_models/dream-map-objects";
import { Injectable, OnDestroy } from "@angular/core";
import { Clock, DataTexture, Mesh } from "three";





@Injectable()

export class DreamMapObjectService implements OnDestroy {

  private emptyControllers: CustomObjectKey<number, CustomObjectKey<string, [DreamMapObjectTemplate, string[]]>> = {};
  private objectControllers: CustomObjectKey<number, CustomObjectKey<string, [DreamMapObjectTemplate, string[]]>> = {};





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
    const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, displacementTexture, closestsCeils, dreamMapSettings];
    let useDefault: boolean = true;
    // Требуется объект
    if (!!objectId) {
      const objectData: DreamMapObject = GetDreamMapObjectByID(objectId);
      // Объект найден
      if (!!objectData) {
        const controller: DreamMapObjectTemplate[] = !!this.objectControllers[objectId] ?
          Object.values(this.objectControllers[objectId]).map(c => c[0].updateDatas(...params)) :
          objectData.controllers.map(c => new c(...params));
        const mixedObject: (MapObject | MapObject[])[] = controller
          .map(c => ([c, c.getObject()]))
          .map(([c, objects]) => {
            const allObjects: MapObject[] = (Array.isArray(objects) ? objects : [objects as MapObject]);
            const object: MapObject = allObjects[0];
            // Запомнить контроллер
            this.objectControllers[objectId] = this.objectControllers[objectId] ?? {};
            this.objectControllers[objectId][object.type] = [c as DreamMapObjectTemplate, allObjects.map(({ type }) => type)];
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
        Object.values(this.emptyControllers[terrainId]).map(c => c[0].updateDatas(...params)) :
        ObjectControllers[terrainId].map(c => new c(...params));
      const mixedObject: (MapObject | MapObject[])[] = controller
        .map(c => ([c, c.getObject()]))
        .map(([c, cs]) => {
          const objects: MapObject | MapObject[] = Array.isArray(cs) ?
            cs.filter(cs => !!cs).map(c => ({ ...c, isDefault: true } as MapObject)) :
            !!cs ? ({ ...cs, isDefault: true } as MapObject) : null;
          // Запомнить контроллеры
          if ((Array.isArray(objects) && !!objects?.length) || (!Array.isArray(objects) && !!objects)) {
            const allObjects: MapObject[] = (Array.isArray(objects) ? objects : [objects as MapObject]);
            const object: MapObject = allObjects[0];
            // Запомнить контроллер
            this.emptyControllers[terrainId] = this.emptyControllers[terrainId] ?? {};
            this.emptyControllers[terrainId][object.type] = [c as DreamMapObjectTemplate, allObjects.map(({ type }) => type)];
            // Вернуть объекты
            return objects as MapObject | MapObject[];
          }
          // Пустой объект
          return null;
        })
        .filter(cs => !!cs);
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
    dreamMapSettings: DreamMapSettings
  ): void {
    const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, displacementTexture, closestsCeils, dreamMapSettings];
    const type: string = objectSetting.type;
    const isDefault: boolean = objectSetting.isDefault;
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId && !isDefault) {
      const objectData: DreamMapObject = GetDreamMapObjectByID(objectId);
      const controllerType: string = ArrayFilter(Object.entries(this.objectControllers[objectId]), ([, [, types]]) => types.includes(type)).map(([key]) => key)[0];
      // Объект найден
      if (!!objectData && !!this.objectControllers[objectId] && !!controllerType) {
        this.objectControllers[objectId][controllerType][0].updateDatas(...params);
        this.objectControllers[objectId][controllerType][0].updateHeight(objectSetting);
      }
    }
    // Требуется пустой объект
    else if (isDefault) {
      const controllerType: string = ArrayFilter(Object.entries(this.emptyControllers[terrainId]), ([, [, types]]) => types.includes(type)).map(([key]) => key)[0];
      // Объект найден
      if (!!this.emptyControllers[terrainId] && !!controllerType) {
        this.emptyControllers[terrainId][controllerType][0].updateDatas(...params);
        this.emptyControllers[terrainId][controllerType][0].updateHeight(objectSetting);
      }
    }
  }

  // Получение под типа
  getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string, subType: string): string {
    const objectId: number = ceil?.object ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    let useDefault: boolean = true;
    // Требуется объект
    if (!!objectId) {
      const objectData: DreamMapObject = GetDreamMapObjectByID(objectId);
      // Объект найден
      if (!!objectData && !!objectData.subTypeFunctions[type]) {
        return objectData.subTypeFunctions[type](ceil, neighboringCeils, type, subType);
      }
    }
    // Требуется пустой объект
    if ((useDefault || !objectId) && !!ObjectStaticSubTypeControllers[terrainId] && !!ObjectStaticSubTypeControllers[terrainId][type]) {
      return ObjectStaticSubTypeControllers[terrainId][type](ceil, neighboringCeils, type, subType);
    }
    // Вернуть пусто
    return "";
  }





  ngOnDestroy(): void {
    Object.values(this.objectControllers).forEach(controllers => Object.values(controllers).filter(([c]) => !!c).forEach(([controller]) => controller.destroy()));
    Object.values(this.emptyControllers).forEach(controllers => Object.values(controllers).filter(([c]) => !!c).forEach(([controller]) => controller.destroy()));
  }
}
