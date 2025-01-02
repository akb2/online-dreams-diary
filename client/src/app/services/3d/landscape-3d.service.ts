import { ColorsChannelsCount, MaxColorValue, NeighBoringSectors, NeighBoringShifts, ReliefTexturePath, TexturePaths } from "@_datas/dream-map";
import { DreamMapTerrainName } from "@_datas/dream-map-objects";
import { AoMapTextureName, MapTextureName, MaskNames, MetalnessMapTextureName, NormalMapTextureName, ParallaxMapTextureName, ParallaxScale, RoughnessMapTextureName, TerrainColorDepth, TerrainDefines, TerrainFragmentShader, TerrainRepeat, TerrainUniforms, TerrainVertexShader } from "@_datas/three.js/shaders/terrain.shader";
import { AngleToRad, Average, AverageSumm, CheckInRange, LengthByCoords, LineFunc, MathFloor, MathRound, ParseInt } from "@_helpers/math";
import { ArrayMap, ForCycle, MapCycle, XYMapEach } from "@_helpers/objects";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { BaseTextureType, DreamMap, DreamMapCeil, DreamMapSector, MapTerrain, ReliefType } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";
import { LoadTexture, Uniforms } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeTextureUniform, ThreeVector2Uniform } from "@_threejs/base";
import { Injectable } from "@angular/core";
import { BackSide, DataTexture, Float32BufferAttribute, FrontSide, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, PlaneGeometry, RGBAFormat, RepeatWrapping, ShaderMaterial, Texture, UniformsUtils } from "three";
import { Ceil3dService } from "./ceil-3d.service";
import { Settings3DService } from "./settings-3d.service";

@Injectable()

export class Landscape3DService {

  dreamMap: DreamMap;

  outSideRepeat: number = 1;

  mesh: Mesh;
  geometry: PlaneGeometry;
  material: ShaderMaterial;

  private displacementTexture: DataTexture;
  private smoothedDisplacementTexture: DataTexture;
  private reliefCanvases: CustomObjectKey<ReliefType, HTMLCanvasElement> = {};
  private geometryVertex: Float32BufferAttribute;

  private terrainTextureKeys: CustomObjectKey<BaseTextureType, string> = {
    face: MapTextureName,
    normal: NormalMapTextureName,
    ao: AoMapTextureName,
    roughness: RoughnessMapTextureName,
    metalness: MetalnessMapTextureName,
    parallax: ParallaxMapTextureName
  };
  private maskTextures: DataTexture[] = [];
  private mapTextures: CustomObjectKey<BaseTextureType, Texture> = {};

  textures: Partial<LoadTexture>[] = [
    ...Object.values(ReliefType).map(type => ({
      url: ReliefTexturePath + type + "." + ImageExtension.png,
      afterLoadEvent: this.reliefLoaded.bind(this, type)
    })),
    // Текстуры ландшафта
    ...Object.keys(this.terrainTextureKeys).map(type => ({
      url: TexturePaths[type] + "." + ImageExtension.png,
      afterLoadEvent: this.mapTextureLoaded.bind(this, type as BaseTextureType)
    }))
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
    const canvas = this.reliefCanvases[reliefType];
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const scaledTextureX = MathFloor((textureX / width) * (canvas.width - 1));
    const scaledTextureZ = MathFloor((textureZ / height) * (canvas.height - 1));
    const imageWidth = imageData.width;
    const imageHeight = imageData.height;
    // Вернуть цвет
    return Average(XYMapEach(2, 2, (z, x) => {
      const iZ: number = CheckInRange(scaledTextureZ + z, imageHeight - 1, 0);
      const iX: number = CheckInRange(scaledTextureX + x, imageWidth - 1, 0);
      const position = ((iX * imageData.width) + iZ) * ColorsChannelsCount;
      // Вернуть цвет
      return imageData.data[position];
    }));
  }

  // Получение предварительной высоты вершины в виде цвета
  private getColorByCoords(x: number, z: number, y: number): number {
    return this.ceil3dService.isBorderCeil(x, z) || y === this.settings3DService.defaultHeight
      ? this.getColorByReliefTypeAndCoords(this.getReliefTypeBySector(this.ceil3dService.getSectorByCoords(x, z)), x, z)
      : MathRound((y / this.settings3DService.maxHeight) * MaxColorValue);
  }

  // Данные для высоты
  private getDisplacementData(ceil?: DreamMapCeil): HeightsImageData {
    const imageWidth: number = this.displacementTexture.image.width;
    const imageHeight: number = this.displacementTexture.image.height;
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const mapBorderSizeX: number = mapWidth * this.outSideRepeat;
    const mapBorderSizeY: number = mapHeight * this.outSideRepeat;
    const x = ParseInt(ceil?.coord?.x);
    const y = ParseInt(ceil?.coord?.y);
    const originalZ = ParseInt(ceil?.coord?.originalZ);
    const vertexStartX: number = x + mapBorderSizeX;
    const vertexStartY: number = y + mapBorderSizeY;
    const vertexWidth: number = (mapWidth * ((this.outSideRepeat * 2) + 1)) + 1;
    const indexV: number = (vertexStartY * vertexWidth) + vertexStartX;
    const scale: number = this.settings3DService.realMaxHeight;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const height: number = (mapBorderSizeY * 2) + mapHeight;
    const textureX: number = x + mapBorderSizeX;
    const textureY: number = y + mapBorderSizeY;
    const indexI: number = ((textureY * width) + textureX) * ColorsChannelsCount;
    // Вернуть массив данных
    return { x, y, originalZ, vertexStartX, vertexStartY, indexV, indexI, imageWidth, imageHeight, scale, width, height, mapBorderSizeX, mapBorderSizeY };
  }

  // Список индексов в изображении высот по ячейке
  private getDisplacementIndexes(ceil: DreamMapCeil): number[] {
    const { vertexStartX, vertexStartY, imageHeight, imageWidth } = this.getDisplacementData(ceil);
    // Координаты
    return XYMapEach(2, 2, (x2, y2) => {
      const iY: number = CheckInRange(vertexStartY + y2 - 1, imageHeight - 1, 0);
      const iX: number = CheckInRange(vertexStartX + x2 - 1, imageWidth - 1, 0);
      // Индекс
      return ((iY * imageWidth) + iX) * ColorsChannelsCount;
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
    const { scale: maxHeight } = this.getDisplacementData(ceil);
    // Расчет
    return CheckInRange((this.getDisplacementMiddleZColor(ceil, getOriginal) / MaxColorValue) * maxHeight, maxHeight, 0);
  }

  // Получить сведения о цвете
  private getColor(layout: number, color: number, terrain: MapTerrain): number {
    return terrain.splatMap.layout === layout && terrain.splatMap.color === color
      ? MaxColorValue
      : 0;
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
    const radius = Math.max(mapWidth, mapHeight);
    const mapHalfWidth = mapWidth / 2;
    const mapHalfHeight = mapHeight / 2;
    const sector = this.ceil3dService.getSectorByCoords(x, y);
    const neighBoringSectors = NeighBoringSectors?.[sector] ?? {};
    const currentColor = this.getDisplacementMiddleZColor(ceil, true);
    const colors: number[] = [];
    let selfKoof: number = 1;
    // Цикл по соседним сторонам
    ArrayMap(
      Object.entries(neighBoringSectors),
      ([, sector]) => {
        const centerX = (ParseInt(NeighBoringShifts?.[sector]?.x) * mapWidth) + mapHalfWidth;
        const centerY = (ParseInt(NeighBoringShifts?.[sector]?.y) * mapHeight) + mapHalfHeight;
        const distance = Math.abs(LengthByCoords({ x, y }, { x: centerX, y: centerY }));
        const koof = LineFunc(0.5, 0, distance, 0, radius);
        // Коэффициент в допустимом пределе
        if (koof > 0 && koof < 0.25) {
          const tempColor = getColor(sector);
          // Добавить в массив
          selfKoof -= koof;
          colors.push(tempColor * koof);
        }
      },
      true
    );
    // Добавить собственную высоту
    colors.push(currentColor * selfKoof);
    // Новая высота
    const color = AverageSumm(colors);
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



  constructor(
    private ceil3dService: Ceil3dService,
    private settings3DService: Settings3DService
  ) { }



  // Создание объекта
  create(): void {
    this.createGeometry();
    this.createTextures();
    this.createMaterial();
    // Свойства объекта
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.rotateX(AngleToRad(-90));
    this.mesh.matrixAutoUpdate = false;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.name = DreamMapTerrainName;
    this.mesh.position.setY(this.settings3DService.startHeight);
    this.mesh.renderOrder = 1;
    this.mesh.updateMatrix();
  }

  // Создание материала
  private createGeometry(): void {
    const width = ParseInt(this.dreamMap.size.width);
    const height = ParseInt(this.dreamMap.size.height);
    const repeat: number = 1 + (this.outSideRepeat * 2)
    const totalWidth: number = width * repeat;
    const totalHeight: number = height * repeat;
    const totalSize: number = totalWidth * totalHeight;
    // Создание геометрии
    this.geometry = new PlaneGeometry(totalWidth * this.settings3DService.ceilSize, totalHeight * this.settings3DService.ceilSize, totalWidth, totalHeight);
    this.geometryVertex = this.geometry.getAttribute("position") as Float32BufferAttribute;
    this.displacementTexture = new DataTexture(new Uint8Array(ColorsChannelsCount * totalSize), totalWidth, totalHeight);
    // Свойства геоиетрии
    this.displacementTexture.magFilter = LinearFilter;
    this.displacementTexture.minFilter = LinearFilter;
    this.displacementTexture.flipY = true;
    this.smoothedDisplacementTexture = this.displacementTexture.clone();
  }

  // Создание карты текстур
  private createTextures(): void {
    const { width, height, mapBorderSizeX, mapBorderSizeY } = this.getDisplacementData();
    const size: number = width * height;
    // Цикл по количеству масок
    this.maskTextures = MapCycle(TerrainColorDepth, d => {
      const data: Uint8Array = new Uint8Array(ColorsChannelsCount * size);
      const texture: DataTexture = new DataTexture(data, width, height);
      // Цикл по размеру
      ForCycle(size, s => {
        const stride: number = s * ColorsChannelsCount;
        const realX: number = MathRound((s - (Math.floor(s / width) * width)), 2);
        const realY: number = MathRound(height - 1 - Math.floor(s / width), 2);
        const x: number = Math.floor(realX) - mapBorderSizeX;
        const y: number = Math.ceil(realY) - mapBorderSizeY;
        const terrain: MapTerrain = this.ceil3dService.getTerrain(x, y);
        // Цвета
        ForCycle(ColorsChannelsCount, k => data[stride + k] = this.getColor(d, k, terrain));
      });
      // Настройки
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearFilter;
      texture.anisotropy = 1;
      texture.colorSpace = LinearSRGBColorSpace;
      texture.format = RGBAFormat;
      texture.needsUpdate = true;
      // Вернуть текстуру
      return texture;
    });
  }

  // Создание материала
  private createMaterial(): void {
    this.material = new ShaderMaterial({
      vertexShader: TerrainVertexShader,
      fragmentShader: TerrainFragmentShader,
      lights: true,
      transparent: true,
      defines: TerrainDefines,
      side: FrontSide,
      wireframe: false,
      extensions: {
        derivatives: true,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false,
      }
    });
    // Свойства материала
    this.material.clipShadows = true;
    this.material.dithering = true;
    this.material.shadowSide = BackSide;
    this.material.alphaTest = 0;
    this.material.depthTest = true;
    this.material.depthWrite = true;
    this.material.needsUpdate = true;
  }

  // Загрузка картинок рельефа
  private reliefLoaded(type: ReliefType, texture: Texture): void {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
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

  // Загрузка текстур типа ландшафта
  private mapTextureLoaded(type: BaseTextureType, texture: Texture): void {
    texture.format = RGBAFormat;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.colorSpace = LinearSRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 1;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    // Запомнить текстуру
    this.mapTextures[type] = texture;
  }

  // Обновить геометрю
  updateGeometry(): void {
    this.geometry.setAttribute("position", this.geometryVertex);
    this.geometry.computeVertexNormals();
    this.geometry.computeTangents();
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }

  // Заполнение материала
  updateMaterial(): void {
    const { width, height } = this.getDisplacementData();
    const repeatX: number = MathRound(TerrainRepeat * width);
    const repeatY: number = MathRound(TerrainRepeat * height);
    const textures: CustomObject<Texture | DataTexture> = {
      ...MaskNames.reduce((o, name, k) => ({ ...o, [name]: this.maskTextures[k] }), {}),
      ...Object.entries(this.terrainTextureKeys).reduce((o, [type, name]) => ({ ...o, [name]: this.mapTextures[type] }), {})
    };
    const fogNear = this.settings3DService.fogNear;
    const fogFar = this.settings3DService.fogFar;
    const uniforms: Uniforms = UniformsUtils.merge([
      TerrainUniforms,
      {
        // ? Рекомендуемо: 3 единицы размера на 1 шаг
        parallaxDistance: ThreeFloatUniform(fogNear + ((fogFar - fogNear) * 0.8)),
        parallaxScale: ThreeFloatUniform(ParallaxScale * (this.settings3DService.ceilSize / this.settings3DService.ceilParts)),
        fogNear: ThreeFloatUniform(fogNear),
        fogFar: ThreeFloatUniform(fogFar),
      },
      {
        ...Object.entries(textures).reduce((o, [name, value]) => ({ ...o, [name]: ThreeTextureUniform(value) }), {}),
        mapRepeat: ThreeVector2Uniform(repeatX, repeatY)
      }
    ]);
    // Обновление материала
    this.material.uniforms = uniforms;
    this.material.uniformsNeedUpdate = true;
  }
}



interface HeightsImageData {
  width: number;
  height: number;
  mapBorderSizeX: number;
  mapBorderSizeY: number;
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
