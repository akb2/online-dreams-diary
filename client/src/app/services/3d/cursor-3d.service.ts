import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { Injectable } from "@angular/core";
import { Mesh, ShaderMaterial } from "three";





@Injectable()

export class Cursor3DService {
  mesh: Mesh;
  material: ShaderMaterial;

  hoverItems = [
    DreamMapTerrainName
  ];





  // Создание курсора
  create(): void {
  }
}
