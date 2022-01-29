import { Injectable } from "@angular/core";
import { DreamMapRoad, MapRoad, TerrainMaterialCache, TerrainTextureCache } from "@_models/dream-map";
import { Road } from "@_services/dream-map/roads/basic";
import { OrdinaryRoad } from "@_services/dream-map/roads/ordinary-road";
import { Group, MeshPhongMaterial, Texture } from "three";





@Injectable({ providedIn: "root" })

export class RoadService {


  private textureCache: TerrainTextureCache[] = [];
  private materialCache: TerrainMaterialCache[] = [];





  // Дорога для отрисовки
  getObject(dreamMapRoad: DreamMapRoad, ceilSize: number): Group {
    const mapRoad: MapRoad = this.getRoad(dreamMapRoad.road);
    const object: Road = new mapRoad.class(
      ceilSize,
      dreamMapRoad.start.x,
      dreamMapRoad.start.y,
      dreamMapRoad.end.x,
      dreamMapRoad.end.y,
      this.textureCache,
      this.materialCache
    );
    // Вернуть группу
    return object.getObject();
  }





  // Тип дороги
  private getRoad(roadId: number): MapRoad {
    return MapRoads.find(r => r.id === roadId) || MapRoads[0];
  }
}





// Список дорог
export const MapRoads: MapRoad[] = [
  // Однополосная дорога
  {
    id: 1,
    title: "Однополосная дорога",
    isAvail: true,
    class: OrdinaryRoad,
  }
];