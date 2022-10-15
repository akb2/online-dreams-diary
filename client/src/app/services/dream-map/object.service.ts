import { Injectable } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapGrassObject } from "@_services/dream-map/objects/grass";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { DreamDefHeight, DreamMapSize, DreamTerrain } from "@_services/dream.service";
import { Clock, Group, Mesh } from "three";





@Injectable({
  providedIn: "root"
})

export class DreamMapObjectService {


  private dreamMap: DreamMap;





  // Получить ячейку
  private getCeil(x: number, y: number): DreamMapCeil {
    return this.dreamMap?.ceils?.find(c => c.coord.x === x && c.coord.y === y) || this.getDefaultCeil(x, y);
  }

  // Ячейка по умолчанию
  private getDefaultCeil(x: number, y: number): DreamMapCeil {
    return {
      place: null,
      terrain: DreamTerrain,
      object: null,
      coord: {
        x,
        y,
        z: DreamDefHeight,
        originalZ: DreamDefHeight
      }
    };
  }

  // получение объекта
  getObject(dreamMap: DreamMap, ceil: DreamMapCeil, terrain: Mesh, clock: Clock): Group {
    // Свойства
    const objectId: number = ceil?.object?.id ?? 0;
    // Требуется объект
    if (objectId > 0) {
    }
    // Объект не требуется
    return null;
  }

  // Получение пустого объекта
  getEmptyObjects(dreamMap: DreamMap, terrain: Mesh, clock: Clock, displacementCanvas: HTMLCanvasElement): Group[] {
    // Свойства
    const oWidth: number = dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = dreamMap.size.height ?? DreamMapSize;
    const terrains: Set<number> = new Set(Array.from(Array(oHeight).keys()).map(y => Array.from(Array(oWidth).keys())
      .map(x => this.getCeil(x, y)))
      .reduce((o, c) => ([...o, ...c]), [])
      .filter(c => !c.object?.id)
      .filter(c => !!ObjectsForEmptyTerrains[c.terrain])
      .map(c => c.terrain));
    // Если требуется
    if (!!terrains.size) {
      return Array.from(terrains).map(t => {
        const controller: DreamMapObjectTemplate = new ObjectsForEmptyTerrains[t](
          dreamMap,
          null,
          terrain,
          clock,
          this.alphaFogService,
          displacementCanvas,
          [],
        );
        const object: Group = controller.getObject();
        // Вернуть группу
        return object;
      });
    }
    // Объект не требуется
    return [];
  }





  constructor(
    private alphaFogService: DreamMapAlphaFogService
  ) { }
}





// Список ландшафтов с объектами для непустых ячеек
const ObjectsForEmptyTerrains: CustomObjectKey<number, {
  new(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[],
  ): DreamMapObjectTemplate
}> = {
  1: DreamMapGrassObject,
};
