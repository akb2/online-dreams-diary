import { NeighBoringSectors } from "@_datas/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamDefHeight, DreamMaxHeight } from "@_datas/dream-map-settings";
import { AngleToRad, Average, AverageSumm, CheckInRange, MathFloor, MathRound, ParseInt } from "@_helpers/math";
import { XYMapEach } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapCeil, DreamMapSector, ReliefType } from "@_models/dream-map";
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
  private smoothRadius = 3;

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





  // Получить тип рельефа по сектору
  private getReliefTypeBySector(sector: DreamMapSector): ReliefType {
    return sector === "center"
      ? ReliefType.flat
      : this.dreamMap.relief.types?.[sector] as ReliefType;
  }

  // Получение цвета высоты из определенной карты рельефов
  private getColorByReliefTypeAndCoords(reliefType: ReliefType, x: number, z: number): number {
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const mapBorderSizeX = mapWidth * this.outSideRepeat;
    const mapBorderSizeZ = mapHeight * this.outSideRepeat;
    const textureX: number = x + mapBorderSizeX;
    const textureZ: number = z + mapBorderSizeZ;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const height: number = (mapBorderSizeZ * 2) + mapHeight;
    const canvasSize = 4;
    const canvas = this.reliefCanvases[reliefType];
    const context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const scaledTextureX = MathFloor((textureX / width) * (canvas.width - 1));
    const scaledTextureZ = MathFloor((textureZ / height) * (canvas.height - 1));
    const imageWidth = imageData.width;
    const imageHeight = imageData.height;
    // Вернуть цвет
    return Average(XYMapEach(2, 2, (z, x) => {
      const iZ: number = CheckInRange(scaledTextureZ + z, imageHeight - 1, 0);
      const iX: number = CheckInRange(scaledTextureX + x, imageWidth - 1, 0);
      const position = ((iX * imageData.width) + iZ) * canvasSize;
      //
      return imageData.data[position];
    }));
  }

  // Получение предварительной высоты вершины в виде цвета
  private getColorByCoords(x: number, z: number, y: number): number {
    return this.ceil3dService.isBorderCeil(x, z) || y === DreamDefHeight
      ? this.getColorByReliefTypeAndCoords(this.getReliefTypeBySector(this.ceil3dService.getSectorByCoords(x, z)), x, z)
      : MathRound((y / DreamMaxHeight) * this.maxColorValue);
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
      const iY: number = CheckInRange(vertexStartY + y2 - 1, imageHeight - 1, 0);
      const iX: number = CheckInRange(vertexStartX + x2 - 1, imageWidth - 1, 0);
      // Индекс
      return ((iY * imageWidth) + iX) * 4;
    });
  }

  // Среднее значение высоты в виде цвета в изображении высот
  private getDisplacementMiddleZColor(ceil: DreamMapCeil, getOriginal: boolean = false): number {
    const data = getOriginal
      ? this.displacementTexture.image.data
      : this.smoothedDisplacementTexture.image.data;
    // Вернуть цвет
    return Average(this.getDisplacementIndexes(ceil).map(index => data[index]));
  }

  // Среднее значение высоты в изображении высот
  private getDisplacementMiddleZ(ceil: DreamMapCeil, getOriginal: boolean = false): number {
    const maxHeight = this.getDisplacementData(ceil).scale;
    // Расчет
    return CheckInRange((this.getDisplacementMiddleZColor(ceil, getOriginal) / this.maxColorValue) * maxHeight, maxHeight, 0);
  }





  constructor(
    private ceil3dService: Ceil3dService
  ) { }





  // Создание объекта
  create(): void {
    const width = ParseInt(this.dreamMap.size.width);
    const height = ParseInt(this.dreamMap.size.height);
    const repeat: number = 1 + (this.outSideRepeat * 2)
    const totalWidth: number = width * repeat;
    const totalHeight: number = height * repeat;
    const totalSize: number = totalWidth * totalHeight;
    // Создание свойств
    this.displacementTexture = new DataTexture(new Uint8Array(4 * totalSize), totalWidth, totalHeight);
    this.geometry = new PlaneGeometry(totalWidth * DreamCeilSize, totalHeight * DreamCeilSize, totalWidth, totalHeight);
    this.geometryVertex = this.geometry.getAttribute("position") as Float32BufferAttribute;
    this.material = new MeshBasicMaterial({
      side: FrontSide,
      wireframe: true,
      color: 0x000000
    });
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
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
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
    this.displacementTexture.image.data[indexI] = color;
    this.smoothedDisplacementTexture.image.data[indexI] = color;
  }

  // Сглаживание
  setSmoothByCoords(ceil: DreamMapCeil): void {
    const { coord: { x, y } } = ceil;
    const getColor = (neighBoringSector: DreamMapSector): number => !!neighBoringSector
      ? this.getColorByReliefTypeAndCoords(this.getReliefTypeBySector(neighBoringSector), x, y)
      : 0;
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const sector = this.ceil3dService.getSectorByCoords(x, y);
    const neighBoringSectors = NeighBoringSectors?.[sector] ?? {};
    const shiftX = this.ceil3dService.sectorDimension(x, mapWidth) * mapWidth;
    const shiftY = this.ceil3dService.sectorDimension(y, mapHeight) * mapHeight;
    const mapHalfWidth = mapWidth / 2;
    const mapHalfHeight = mapHeight / 2;
    const centeredX = x - shiftX - mapHalfWidth;
    const centeredY = y - shiftY - mapHalfHeight;
    const xKoof = Math.abs(centeredX / mapWidth / 2);
    const yKoof = Math.abs(centeredY / mapHeight / 2);
    const leftKoof = !!neighBoringSectors?.left && centeredX < 0 ? xKoof : 0;
    const rightKoof = !!neighBoringSectors?.right && centeredX >= 0 ? xKoof : 0;
    const topKoof = !!neighBoringSectors?.top && centeredY < 0 ? yKoof : 0;
    const bottomKoof = !!neighBoringSectors?.bottom && centeredY >= 0 ? yKoof : 0;
    const selfKoof = 1 - leftKoof - rightKoof - topKoof - bottomKoof;
    const currentColor = this.getDisplacementMiddleZColor(ceil, true);
    let color = AverageSumm([
      currentColor * selfKoof,
      getColor(neighBoringSectors.left) * leftKoof,
      getColor(neighBoringSectors.right) * rightKoof,
      getColor(neighBoringSectors.top) * topKoof,
      getColor(neighBoringSectors.bottom) * bottomKoof,
    ]);
    // Замена высоты
    if (color !== currentColor) {
      const { indexI } = this.getDisplacementData(ceil);
      // Запись
      this.smoothedDisplacementTexture.image.data[indexI] = color;
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
