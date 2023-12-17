import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { DreamCeilSize } from "@_datas/dream-map-settings";
import { Injectable } from "@angular/core";
import { CylinderGeometry, Mesh, ShaderMaterial } from "three";





@Injectable()

export class Cursor3DService {
  private heightMultiplier = 0.3;
  private radialSigmentsMultiplier = 8;

  mesh: Mesh;
  material: ShaderMaterial;
  geometry: CylinderGeometry;

  hoverItems = [
    DreamMapTerrainName
  ];





  // Получить размер
  private getGeometryRadius(size: number): number {
    return (((size * 2) + 1) * DreamCeilSize) / 2;
  }





  // Создание курсора
  create(): void {
    this.createGeometry(1);
  }

  // Создание геометрии
  private createGeometry(originalSize: number): void {
    const radius = this.getGeometryRadius(originalSize);
    const height = DreamCeilSize * this.heightMultiplier;
    const radialSegments = originalSize * this.radialSigmentsMultiplier;
    // Новая геометрия
    this.geometry = new CylinderGeometry(radius, radius, height, radialSegments, 1, false);
  }
}
