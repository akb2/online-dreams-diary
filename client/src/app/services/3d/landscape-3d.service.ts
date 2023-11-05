import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxHeight } from "@_datas/dream-map-settings";
import { AngleToRad, CheckInRange, MathRound, ParseInt } from "@_helpers/math";
import { ForCycle, XYMapEach } from "@_helpers/objects";
import { DreamMap, DreamMapCeil, ReliefType } from "@_models/dream-map";
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

  private displacementTexture: DataTexture;
  private geometryVertex: Float32BufferAttribute;

  // Список текстур ландшафта
  textures: string[] = [
    ...Object.values(ReliefType).map(type => "/assets/dream-map/relief/" + type + ".png"),
    "/assets/dream-map/terrain/face.png",
    "/assets/dream-map/terrain/normal.png"
  ];





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
    this.displacementTexture = new DataTexture(new Uint8Array(4 * totalSize), totalWidth, totalHeight);
    this.geometry = new PlaneGeometry(totalWidth, totalHeight, totalWidth, totalHeight);
    this.geometryVertex = this.geometry.getAttribute("position") as Float32BufferAttribute;
    this.material = new MeshBasicMaterial({ side: FrontSide, color: 0x000000, wireframe: true });
    this.mesh = new Mesh(this.geometry, this.material);
    // Свойства класса
    this.geometryVertex = this.geometry.getAttribute("position") as Float32BufferAttribute;
    this.displacementTexture.magFilter = LinearFilter;
    this.displacementTexture.minFilter = LinearFilter;
    this.displacementTexture.flipY = true;
    // Настройки
    this.mesh.rotateX(AngleToRad(-90));
  }

  // Установка высоты
  setHeightByCoords(ceil: DreamMapCeil): void {
    const mapWidth: number = ParseInt(this.dreamMap?.size?.width, DreamMapSize);
    const mapHeight: number = ParseInt(this.dreamMap?.size?.height, DreamMapSize);
    const mapBorderSize: number = Math.max(mapWidth, mapHeight) * this.outSideRepeat;
    const { coord: { x, y, originalZ: z } } = ceil;
    // Наружняя ячейка
    if (this.ceil3dService.isBorderCeil(x, y)) {
    }
    // Рабочая ячейка
    else {
      const width: number = (mapBorderSize * 2) + mapWidth;
      const textureX: number = x + mapBorderSize;
      const textureY: number = y + mapBorderSize;
      const index: number = ((textureY * width) + textureX) * 4;
      const color: number = MathRound(CheckInRange((z * 255) / DreamMaxHeight, 255, 0), 5);
      // Записать данные в картинку
      ForCycle(3, k => this.displacementTexture.image.data[index + k] = color, true);
    }
    // Обновить картинку
    this.displacementTexture.needsUpdate = true;
    this.material.needsUpdate = true;
  }

  // Установка вершины
  setVertexByCoords(ceil: DreamMapCeil): void {
    const mapWidth: number = ParseInt(this.dreamMap?.size?.width, DreamMapSize);
    const mapHeight: number = ParseInt(this.dreamMap?.size?.height, DreamMapSize);
    const mapBorderSize: number = Math.max(mapWidth, mapHeight) * this.outSideRepeat;
    const { coord: { x, y } } = ceil;
    const vertexStartX: number = x + mapBorderSize;
    const vertexStartY: number = y + mapBorderSize;
    const vertexWidth: number = (mapWidth * ((this.outSideRepeat * 2) + 1)) + 1;
    const imageWidth: number = this.displacementTexture.image.width;
    const imageHeight: number = this.displacementTexture.image.height;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    // Наружняя ячейка
    if (this.ceil3dService.isBorderCeil(x, y)) {
    }
    // Рабочая ячейка
    else {
      const indexV: number = (vertexStartY * vertexWidth) + vertexStartX;
      const indexes: number[] = XYMapEach(2, 2, (x2, y2) => {
        x2 = vertexStartX + x2 - 1;
        y2 = vertexStartY + y2 - 1;
        // Координаты
        const iY: number = y2 < 0 ? 0 : (y2 >= imageHeight - 1 ? imageHeight - 1 : y2);
        const iX: number = x2 < 0 ? 0 : (x2 >= imageWidth - 1 ? imageWidth - 1 : x2);
        // Индекс
        return ((iY * imageWidth) + iX) * 4;
      });
      // Поиск среднего Z
      const z: number = indexes
        .map(index => (this.displacementTexture.image.data[index] / 255) * scale)
        .reduce((o, z) => o + z, 0) / indexes.length;
      // Установить высоту
      this.geometryVertex.setZ(indexV, z);
    }
  }

  // Обновить геометрю
  updateGeometry(): void {
    this.geometry.setAttribute("position", this.geometryVertex);
    this.geometry.computeVertexNormals();
    this.geometry.computeTangents();
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }
}
