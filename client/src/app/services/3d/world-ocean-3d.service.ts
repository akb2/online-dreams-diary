import { TexturePaths, WorldOceanTexturePath } from "@_datas/dream-map";
import { DreamMapOceanName } from "@_datas/dream-map-objects";
import { AoMapTextureName, MapTextureName, MetalnessMapTextureName, NormalMapTextureName, ParallaxMapTextureName, ParallaxScale, RoughnessMapTextureName, WorldOceanDefines, WorldOceanFragmentShader, WorldOceanRepeat, WorldOceanUniforms, WorldOceanVertexShader } from "@_datas/three.js/shaders/ocean.shader";
import { AngleToRad, MathRound, ParseFloat, ParseInt } from "@_helpers/math";
import { XYZForEach } from "@_helpers/objects";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { BaseTextureType, DreamMap, DreamMapCeil, MapSize } from "@_models/dream-map";
import { CoordsXYZToIndex } from "@_models/math";
import { ImageExtension } from "@_models/screen";
import { LoadTexture } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeTextureUniform, ThreeVector2Uniform } from "@_threejs/base";
import { Injectable } from "@angular/core";
import { Data3DTexture, DataTexture, DoubleSide, FloatType, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, MirroredRepeatWrapping, PlaneGeometry, RedFormat, RepeatWrapping, RGBAFormat, ShaderMaterial, Texture, UniformsUtils, Vector3, WebGLRenderer } from "three";
import { Engine3DService } from "./engine-3d.service";
import { Landscape3DService } from "./landscape-3d.service";
import { Settings3DService } from "./settings-3d.service";

@Injectable()

export class WorldOcean3DService {
  dreamMap: DreamMap;
  renderer: WebGLRenderer;

  ocean: Mesh;

  private readonly textureSize = 64;
  private readonly waveSpeed = 0.000005;

  private geometry: PlaneGeometry;
  private material: ShaderMaterial;
  private texture3D: Data3DTexture;
  private mapTextures: CustomObjectKey<BaseTextureType, Texture> = {};

  private textureKeys: CustomObjectKey<BaseTextureType, string> = {
    face: MapTextureName,
    normal: NormalMapTextureName,
    ao: AoMapTextureName,
    roughness: RoughnessMapTextureName,
    metalness: MetalnessMapTextureName,
    parallax: ParallaxMapTextureName
  };

  textures: Partial<LoadTexture>[] = [
    ...Object.keys(this.textureKeys).map(type => ({
      url: TexturePaths(WorldOceanTexturePath)[type] + "." + ImageExtension.png,
      afterLoadEvent: this.mapTextureLoaded.bind(this, type as BaseTextureType)
    }))
  ];

  private readonly oceanFlowSpeed = this.settings3DService.worldOceanFlowSpeed;
  private readonly heightPart = this.settings3DService.ceilSize / this.settings3DService.ceilParts;



  // Данные для высоты
  private getDisplacementData(ceil?: DreamMapCeil): Pick<MapSize, "width" | "height"> {
    const mapWidth: number = this.dreamMap.size.width;
    const mapHeight: number = this.dreamMap.size.height;
    const mapBorderSizeX: number = mapWidth * this.settings3DService.outsideSize;
    const mapBorderSizeY: number = mapHeight * this.settings3DService.outsideSize;
    const width: number = (mapBorderSizeX * 2) + mapWidth;
    const height: number = (mapBorderSizeY * 2) + mapHeight;
    // Вернуть массив данных
    return { width, height };
  }



  constructor(
    private landscape3DService: Landscape3DService,
    private engine3DService: Engine3DService,
    private settings3DService: Settings3DService
  ) { }



  /**
   * Создание окен
   */
  create(): void {
    this.createPerlin3DTexture();
    this.createMaterial();
    this.createWorldOcean();
    // Обновить
    this.updateWorldOcean();
  }

  /**
   * Создать небосвод
   */
  private createWorldOcean(): void {
    const width = ParseInt(this.dreamMap.size.width);
    const height = ParseInt(this.dreamMap.size.height);
    const repeat = 1 + (this.landscape3DService.outSideRepeat * 2)
    const totalWidth = width * repeat;
    const totalHeight = height * repeat;
    const position = new Vector3(0, 0, 0);
    // Создание объекта
    this.geometry = new PlaneGeometry(totalWidth * this.settings3DService.ceilSize, totalHeight * this.settings3DService.ceilSize, 1, 1);
    this.ocean = new Mesh(this.geometry, this.material);
    this.ocean.rotation.x = AngleToRad(-90);
    this.ocean.position.set(position.x, position.y, position.z);
    this.ocean.receiveShadow = true;
    this.ocean.name = DreamMapOceanName;
  }

  /**
   * Создание 3D текстуры из шума Перлина
   */
  private createPerlin3DTexture() {
    const size = this.textureSize;
    const data = new Float32Array(Math.pow(size, 3));
    const octaves = 4;
    const persistence = 0.5;
    const tileFrequency = 2 * Math.PI;
    const scale = 4;
    // Заполнение массива шумом
    XYZForEach(
      size,
      size,
      size,
      (x, y, z) => {
        let noiseValue = 0.0;
        let amplitude = 1.0;
        let frequency = scale;
        // Циклические координаты с замыканием через mod
        for (let i = 0; i < octaves; i++) {
          const u = ((x % size) / size) * frequency;
          const v = ((y % size) / size) * frequency;
          const w = ((z % size) / size) * frequency;
          // Генерация шума
          noiseValue += amplitude * this.dreamMap.noise.perlin3(u, v, w);
          amplitude *= persistence;
          frequency *= 2.0;
        }

        return noiseValue;
      },
      (item, x, y, z) => data[CoordsXYZToIndex(x, y, z, size)] = (item + 1) / 2
    )
    // Создание текстуры
    this.texture3D = new Data3DTexture(data, size, size, size);
    // Параметры текстуры
    this.texture3D.format = RedFormat;
    this.texture3D.magFilter = LinearFilter;
    this.texture3D.minFilter = LinearMipmapLinearFilter;
    this.texture3D.type = FloatType;
    this.texture3D.wrapS = MirroredRepeatWrapping;
    this.texture3D.wrapT = MirroredRepeatWrapping;
    this.texture3D.wrapR = MirroredRepeatWrapping;
    this.texture3D.needsUpdate = true;
  }

  /**
   * Создание материала
   */
  private createMaterial() {
    const { width, height } = this.getDisplacementData();
    const repeatX: number = MathRound(WorldOceanRepeat * width);
    const repeatY: number = MathRound(WorldOceanRepeat * height);
    const fogNear = this.settings3DService.fogNear;
    const fogFar = this.settings3DService.fogFar;
    const textures: CustomObject<Texture | DataTexture> = Object.entries(this.textureKeys).reduce((o, [type, name]) => ({ ...o, [name]: this.mapTextures[type] }), {});
    // Материал
    this.material = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        WorldOceanUniforms,
        {
          parallaxDistance: ThreeFloatUniform(fogNear + ((fogFar - fogNear) * 0.8)),
          parallaxScale: ThreeFloatUniform(ParallaxScale * (this.settings3DService.ceilSize / this.settings3DService.ceilParts)),
          fogNear: ThreeFloatUniform(fogNear),
          fogFar: ThreeFloatUniform(fogFar),
          ...Object.entries(textures).reduce((o, [name, value]) => ({ ...o, [name]: ThreeTextureUniform(value) }), {}),
          mapRepeat: ThreeVector2Uniform(repeatX, repeatY)
        }
      ]),
      fragmentShader: WorldOceanFragmentShader,
      vertexShader: WorldOceanVertexShader,
      side: DoubleSide,
      defines: WorldOceanDefines,
      transparent: true,
      wireframe: false,
      lights: true,
      extensions: {
        derivatives: false,
        fragDepth: false,
        drawBuffers: false,
        shaderTextureLOD: false,
      }
    });
  }

  /**
   * Обновить время
   */
  updateWorldOcean(): void {
    const z = this.heightPart * this.dreamMap.ocean.z;
    // Свойства
    this.ocean.position.setY(z);
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



  /**
   * Анимация
   */
  onAnimate(): void {
    const uniforms = this.material?.uniforms;

    if (!!uniforms) {
      const deltaTime = this.engine3DService.clock.getDelta();
      const newTime = ParseFloat(uniforms.uTime?.value, 0, 20) + (deltaTime * this.waveSpeed);
      // Установить новое время
      uniforms.uTime.value = newTime > 1.0
        ? newTime - 1.0
        : newTime;
    }
  }
}
