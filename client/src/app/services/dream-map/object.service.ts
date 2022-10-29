import { Injectable, OnDestroy } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapCeil, XYCoord } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapGrassObject } from "@_services/dream-map/objects/grass";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { DreamTerrain } from "@_services/dream.service";
import { BufferGeometry, Clock, Color, LOD, Material, Matrix4, Mesh } from "three";





@Injectable()

export class DreamMapObjectService implements OnDestroy {


  private controllers: CustomObjectKey<number, DreamMapObjectTemplate> = {};





  // получение объекта
  getObject(dreamMap: DreamMap, ceil: DreamMapCeil, terrain: Mesh, clock: Clock, displacementCanvas: HTMLCanvasElement): MapObject {
    // Свойства
    const objectId: number = ceil?.object?.id ?? 0;
    const terrainId: number = ceil?.terrain ?? DreamTerrain;
    // Требуется объект
    if (!!objectId) {
    }
    // Требуется пустой объект
    else if (!objectId && ObjectControllers[terrainId]) {
      const params: ObjectControllerParams = [dreamMap, ceil, terrain, clock, this.alphaFogService, displacementCanvas, []];
      const controller: DreamMapObjectTemplate = !!this.controllers[terrainId] ?
        this.controllers[terrainId].updateDatas(...params) :
        new ObjectControllers[terrainId](...params);
      const object: MapObject = controller.getObject();
      // Настройки LOD
      if (object instanceof LOD) {
        object.autoUpdate = false;
      }
      // Обновить данные
      this.controllers[terrainId] = controller;
      // Вернуть группу
      return object;
    }
    // Объект не требуется
    return null;
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
  coords: XYCoord;
  count: number;
  animate?: Function;
};

// Тип контроллера
type ObjectController = {
  new(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[],
  ): DreamMapObjectTemplate
};

// Параметры контроллера
type ObjectControllerParams = [DreamMap, DreamMapCeil, Mesh, Clock, DreamMapAlphaFogService, HTMLCanvasElement, DreamMapCeil[]];

// Список ландшафтов с объектами для непустых ячеек
const ObjectControllers: CustomObjectKey<number, ObjectController> = {
  1: DreamMapGrassObject,
};
