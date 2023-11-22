import { CreateArray } from "@_datas/app";
import { DreamAvailHeightDiff, DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMaxHeight } from "@_datas/dream-map-settings";
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

  private maxColorValue = 255;
  private smoothRadius = 2;

  private displacementTexture: DataTexture;
  private smoothedDisplacementTexture: DataTexture;
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
    let color: number = MathRound(CheckInRange((y * this.maxColorValue) / DreamMaxHeight, this.maxColorValue, 0), 5);
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
      color = MathRound(CheckInRange(Average(CreateArray(canvasSize).map(i => imageData.data[position + i])), this.maxColorValue, 0), 5);
    }
    // Вернуть цвет
    return color;
  }

  // Данные для высоты
  private getDisplacementData(ceil: DreamMapCeil): HeightsImageData {
    const imageWidth: number = this.displacementTexture.image.width;
    const imageHeight: number = this.displacementTexture.image.height;
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const mapBorderSizeX: number = mapWidth * this.outSideRepeat;
    const mapBorderSizeY: number = mapHeight * this.outSideRepeat;
    const { coord: { x, y, originalZ } } = ceil;
    const vertexStartX: number = x + mapBorderSizeX;
    const vertexStartY: number = y + mapBorderSizeY;
    const vertexWidth: number = (mapWidth * ((this.outSideRepeat * 2) + 1)) + 1;
    const indexV: number = (vertexStartY * vertexWidth) + vertexStartX;
    const heightPart: number = DreamCeilSize / DreamCeilParts;
    const scale: number = heightPart * DreamMaxHeight;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const textureX: number = x + mapBorderSizeX;
    const textureY: number = y + mapBorderSizeY;
    const indexI: number = ((textureY * width) + textureX) * 4;
    // Вернуть массив данных
    return { x, y, originalZ, vertexStartX, vertexStartY, indexV, indexI, imageWidth, imageHeight, scale };
  }

  // Список индексов в изображении высот по ячейке
  private getDisplacementIndexes(ceil: DreamMapCeil): number[] {
    const { vertexStartX, vertexStartY, imageHeight, imageWidth } = this.getDisplacementData(ceil);
    // Координаты
    return XYMapEach(2, 2, (x2, y2) => {
      x2 = vertexStartX + x2 - 1;
      y2 = vertexStartY + y2 - 1;
      // Координаты
      const iY: number = y2 < 0 ? 0 : (y2 >= imageHeight - 1 ? imageHeight - 1 : y2);
      const iX: number = x2 < 0 ? 0 : (x2 >= imageWidth - 1 ? imageWidth - 1 : x2);
      // Индекс
      return ((iY * imageWidth) + iX) * 4;
    });
  }

  // Среднее значение высоты в виде цвета в изображении высот
  private getDisplacementMiddleZColor(ceil: DreamMapCeil, getOriginal: boolean = false): number {
    return Average(this.getDisplacementIndexes(ceil).map(index => getOriginal
      ? this.displacementTexture.image.data[index]
      : this.smoothedDisplacementTexture.image.data[index]
    ));
  }

  // Среднее значение высоты в изображении высот
  private getDisplacementMiddleZ(ceil: DreamMapCeil, getOriginal: boolean = false): number {
    return CheckInRange(
      this.getDisplacementMiddleZColor(ceil, getOriginal) / this.maxColorValue * this.getDisplacementData(ceil).scale,
      this.maxColorValue,
      0
    );
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
    this.smoothedDisplacementTexture = this.displacementTexture.clone();
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
    const { x, y, originalZ, indexI } = this.getDisplacementData(ceil);
    const color: number = this.getColorByCoords(x, y, originalZ);
    // Записать данные в картинку
    ForCycle(3, k => {
      this.displacementTexture.image.data[indexI + k] = color;
      this.smoothedDisplacementTexture.image.data[indexI + k] = color;
    }, true);
  }

  // Сглаживание
  setSmoothByCoords(ceil: DreamMapCeil): void {
    const { coord: { x, y } } = ceil;
    // Сглаживать только граничные ячейки
    if (this.ceil3dService.isBorderSectorCeil(x, y)) {
      const { indexI } = this.getDisplacementData(ceil);
      const smoothDiameter = (this.smoothRadius * 2) + 1;
      const currentColor = this.getDisplacementMiddleZColor(ceil, true);
      const color = Average(XYMapEach(smoothDiameter, smoothDiameter, (tX, tY) => this.getDisplacementMiddleZColor(this.ceil3dService.getCeil(
        x + tX - this.smoothRadius,
        y + tY - this.smoothRadius
      ), true)));
      const availDiff = (this.maxColorValue / 100) * DreamAvailHeightDiff;
      const colorDiff = Math.abs(currentColor - color);
      // Сглаживать при значительном перепаде
      if (colorDiff > availDiff) {
        ForCycle(3, k => this.smoothedDisplacementTexture.image.data[indexI + k] = color, true);
      }
    }
  }

  // Установка вершины
  setVertexByCoords(ceil: DreamMapCeil): void {
    const { x, y, indexV } = this.getDisplacementData(ceil);
    const z: number = this.getDisplacementMiddleZ(ceil);
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





interface HeightsImageData {
  imageWidth: number;
  imageHeight: number;
  x: number;
  y: number;
  originalZ: number;
  vertexStartX: number;
  vertexStartY: number;
  indexV: number;
  indexI: number;
  scale: number;
}
