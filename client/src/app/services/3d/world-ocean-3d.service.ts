import { TexturePaths, WorldOceanTexturePath } from "@_datas/dream-map";
import { DreamMapOceanName } from "@_datas/dream-map-objects";
import { AoMapTextureName, MapTextureName, MetalnessMapTextureName, NormalMapTextureName, ParallaxMapTextureName, ParallaxScale, RoughnessMapTextureName, WorldOceanDefines, WorldOceanFragmentShader, WorldOceanRepeat, WorldOceanUniforms, WorldOceanVertexShader } from "@_datas/three.js/shaders/ocean.shader";
import { AngleToRad } from "@_helpers/math";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { BaseTextureType, DreamMap, DreamMapCeil, MapSize } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";
import { LoadTexture } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeTextureUniform, ThreeVector2Uniform } from "@_threejs/base";
import { round } from "@akb2/math";
import { anyToFloat, anyToInt } from "@akb2/types-tools";
import { Injectable } from "@angular/core";
import { DataTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, PlaneGeometry, RepeatWrapping, RGBAFormat, ShaderMaterial, Texture, UniformsUtils, Vector3, WebGLRenderer } from "three";
import { Engine3DService } from "./engine-3d.service";
import { Landscape3DService } from "./landscape-3d.service";
import { Settings3DService } from "./settings-3d.service";

@Injectable()

export class WorldOcean3DService {
  dreamMap: DreamMap;
  renderer: WebGLRenderer;

  ocean: Mesh;

  private readonly waveSpeed = 0.000005;

  private geometry: PlaneGeometry;
  private material: ShaderMaterial;
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
    this.createMaterial();
    this.createWorldOcean();
    // Обновить
    this.updateWorldOcean();
  }

  /**
   * Создать небосвод
   */
  private createWorldOcean(): void {
    const width = anyToInt(this.dreamMap.size.width);
    const height = anyToInt(this.dreamMap.size.height);
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
   * Создание материала
   */
  private createMaterial() {
    const { width, height } = this.getDisplacementData();
    const repeatX: number = round(WorldOceanRepeat * width);
    const repeatY: number = round(WorldOceanRepeat * height);
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
      const newTime = anyToFloat(uniforms.uTime?.value, 0, 20) + (deltaTime * this.waveSpeed);
      // Установить новое время
      uniforms.uTime.value = newTime > 1.0
        ? newTime - 1.0
        : newTime;
    }
  }
}
