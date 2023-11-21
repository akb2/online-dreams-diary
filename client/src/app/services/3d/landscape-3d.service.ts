import { CreateArray } from "@_datas/app";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMaxHeight } from "@_datas/dream-map-settings";
import { AngleToRad, Average, CheckInRange, MathRound } from "@_helpers/math";
import { ForCycle, XYMapEach } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapCeil, ReliefType } from "@_models/dream-map";
import { LoadTexture } from "@_models/three.js/base";
import { Injectable } from "@angular/core";
import { DataTexture, Float32BufferAttribute, FrontSide, LinearFilter, Material, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";
import { Ceil3dService } from "./ceil-3d.service";





@Injectable()

export class Landscape3DService {

  dreamMap: DreamMap;

  outSideRepeat: number = 1;

  mesh: Mesh;
  geometry: PlaneGeometry;
  material: Material;

  private displacementTexture: DataTexture;
  private reliefCanvases: CustomObjectKey<ReliefType, HTMLCanvasElement> = {};
  private geometryVertex: Float32BufferAttribute;

  private terrainTextures: string[] = [
    "/assets/dream-map/terrain/face.png",
    "/assets/dream-map/terrain/normal.png"
  ];

  textures: Partial<LoadTexture>[] = [
    ...Object.values(ReliefType).map(type => ({
      url: "/assets/dream-map/relief/" + type + ".png",
      afterLoadEvent: this.reliefLoaded.bind(this, type)
    })),
    // Текстуры ландшафта
    ...this.terrainTextures.map(url => ({ url }))
  ];

  // Получение предварительной высоты вершины в виде увета
  private getColorByCoords(x: number, z: number, y: number): number {
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const mapBorderSizeX = mapWidth * this.outSideRepeat;
    const mapBorderSizeZ = mapHeight * this.outSideRepeat;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const height: number = (mapBorderSizeZ * 2) + mapHeight;
    const textureX: number = x + mapBorderSizeX;
    const textureZ: number = z + mapBorderSizeZ;
    let color: number = MathRound(CheckInRange((y * 255) / DreamMaxHeight, 255, 0), 5);
    // Наружняя ячейка
    if (this.ceil3dService.isBorderCeil(x, z) || y === DreamDefHeight) {
      const canvasSize = 4;
      const sector = this.ceil3dService.getSectorByCoords(x, z);
      const reliefType = sector === "center"
        ? ReliefType.flat
        : this.dreamMap.relief.types?.[sector] as ReliefType;
      const canvas = this.reliefCanvases[reliefType];
      const context = canvas.getContext("2d");
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const scaledTextureX = Math.floor((textureX / width) * canvas.width);
      const scaledTextureZ = Math.floor((textureZ / height) * canvas.height);
      const position = ((scaledTextureZ * imageData.width) + scaledTextureX) * canvasSize;
      // Обновить цвет
      color = MathRound(CheckInRange(Average(CreateArray(canvasSize).map(i => imageData.data[position + i])), 255, 0), 5);
    }
    // Вернуть цвет
    return color;
  }





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

  // Загрузка картинок рельефа
  private reliefLoaded(type: ReliefType, texture: Texture): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    // Свойства текстуры
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    texture.flipY = false;
    context.drawImage(texture.image, 0, 0);
    // Запомнить текстуру
    this.reliefCanvases[type] = canvas;
  }

  // Установка высоты
  setHeightByCoords(ceil: DreamMapCeil): void {
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const mapBorderSizeX = mapWidth * this.outSideRepeat;
    const mapBorderSizeY = mapHeight * this.outSideRepeat;
    const { coord: { x, y, originalZ: z } } = ceil;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const textureX: number = x + mapBorderSizeX;
    const textureY: number = y + mapBorderSizeY;
    const index: number = ((textureY * width) + textureX) * 4;
    const color: number = this.getColorByCoords(x, y, z);
    // Записать данные в картинку
    ForCycle(3, k => this.displacementTexture.image.data[index + k] = color, true);
    // Обновить картинку
    this.displacementTexture.needsUpdate = true;
    this.material.needsUpdate = true;
  }

  // Сглаживание
  setSmoothByCoords(ceil: DreamMapCeil): void {
  }

  // Установка вершины
  setVertexByCoords(ceil: DreamMapCeil): void {
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const mapBorderSizeX: number = mapWidth * this.outSideRepeat;
    const mapBorderSizeY: number = mapHeight * this.outSideRepeat;
    const { coord: { x, y } } = ceil;
    const vertexStartX: number = x + mapBorderSizeX;
    const vertexStartY: number = y + mapBorderSizeY;
    const vertexWidth: number = (mapWidth * ((this.outSideRepeat * 2) + 1)) + 1;
    const imageWidth: number = this.displacementTexture.image.width;
    const imageHeight: number = this.displacementTexture.image.height;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
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
    this.ceil3dService.getCeil(x, y).coord.z = z;
    this.geometryVertex.setZ(indexV, z);
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
