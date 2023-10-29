import { Injectable } from "@angular/core";
import { FrontSide, Material, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";





@Injectable()

export class Landscape3DService {
  private outSideRepeat: number = 1;

  mesh: Mesh;
  geometry: PlaneGeometry;
  material: Material;





  // Создание объекта
  create(width: number, height: number): void {
    const repeat: number = 1 + (this.outSideRepeat * 2)
    const totalWidth: number = width * repeat;
    const totalHeight: number = height * repeat;
    // Создание свойств
    this.geometry = new PlaneGeometry(totalWidth, totalHeight, totalWidth, totalHeight);
    this.material = new MeshBasicMaterial({ color: 0xAAAAAA, side: FrontSide });
    this.mesh = new Mesh(this.geometry, this.material);
  }
}
