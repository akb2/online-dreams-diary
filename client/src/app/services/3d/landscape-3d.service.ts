import { AngleToRad } from "@_helpers/math";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { Injectable } from "@angular/core";
import { DataTexture, Float32BufferAttribute, FrontSide, LinearFilter, Material, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { Ceil3dService } from "./ceil-3d.service";





@Injectable()

export class Landscape3DService {

  dreamMap: DreamMap;

  outSideRepeat: number = 1;

  mesh: Mesh;
  geometry: PlaneGeometry;
  material: Material;

  private geometryWidth: number;
  private geometryHeight: number;
  private geometryVertex: Float32BufferAttribute;
  private displacementTexture: DataTexture;





  constructor(
    private ceil3dService: Ceil3dService
  ) { }





  // Создание объекта
  create(width: number, height: number): void {
    const repeat: number = 1 + (this.outSideRepeat * 2)
    const totalWidth: number = width * repeat;
    const totalHeight: number = height * repeat;
    const totalSize: number = totalWidth * totalHeight;
    // Создание свойств
    this.geometry = new PlaneGeometry(totalWidth, totalHeight, totalWidth, totalHeight);
    this.material = new MeshBasicMaterial({ color: 0x999999, side: FrontSide });
    this.mesh = new Mesh(this.geometry, this.material);
    this.displacementTexture = new DataTexture(new Uint8Array(4 * totalSize), totalWidth, totalHeight);
    // Свойства класса
    this.geometryWidth = this.geometry.parameters.widthSegments + 1;
    this.geometryHeight = this.geometry.parameters.heightSegments + 1;
    this.geometryVertex = this.geometry.getAttribute("position") as Float32BufferAttribute;
    this.displacementTexture.magFilter = LinearFilter;
    this.displacementTexture.minFilter = LinearFilter;
    this.displacementTexture.flipY = true;
    // Настройки
    this.mesh.rotateX(AngleToRad(-90));
  }

  // Установка высоты
  setHeightByCoords(ceil: DreamMapCeil): void {
    const { coord: { x, y, originalZ: z } } = ceil;
    // Наружняя ячейка
    if (this.ceil3dService.isBorderCeil(x, y)) {
    }
    // Рабочая ячейка
    else {
    }
  }

  // Установка вершины
  setVertexByCoords(ceil: DreamMapCeil): void {
  }
}





// Тип рельефов
export enum ReliefType {
  flat = "flat",
  hill = "hill",
  mountain = "mountain",
  canyon = "canyon",
  pit = "pit",
}
