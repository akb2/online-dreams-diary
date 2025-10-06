import { MaxColorValue } from "@_datas/dream-map";
import { DreamMapSkyName } from "@_datas/dream-map-objects";
import { FragmentShader, VertexShader } from "@_datas/three.js/shaders/clouds.shader";
import { AngleInRange, AngleToRad, Cos, LineFunc, Sin } from "@_helpers/math";
import { XYZForEach } from "@_helpers/objects";
import { CoordDto, DreamMap } from "@_models/dream-map";
import { CoordsXYZToIndex, MinMax } from "@_models/math";
import { AnimationData } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeTextureUniform, ThreeVector3Uniform } from "@_threejs/base";
import { clamp } from "@akb2/math";
import { anyToInt, createArray, CustomObject, CustomObjectKey } from "@akb2/types-tools";
import { Injectable } from "@angular/core";
import { AmbientLight, BackSide, BoxGeometry, ClampToEdgeWrapping, Color, Data3DTexture, DirectionalLight, Fog, GLSL3, IUniform, LinearFilter, LinearMipMapLinearFilter, Mesh, RawShaderMaterial, RedFormat, Vector2, Vector3, WebGLRenderer } from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Landscape3DService } from "./landscape-3d.service";
import { Settings3DService } from "./settings-3d.service";

@Injectable()

export class Sky3DService {
  dreamMap: DreamMap;
  dreamMapSettings = this.settings3DService.settings;
  renderer: WebGLRenderer;

  sky: Sky;
  fog: Fog;
  clouds: Mesh<BoxGeometry, RawShaderMaterial>;
  sun: DirectionalLight;
  atmosphere: AmbientLight;

  private cloudsMaterial: RawShaderMaterial;

  private noiseSize = 0;
  private noiseScale = 0.06;

  private cloudsMultiplierX = 2;
  private cloudsMultiplierZ = 2;
  private cloudsMultiplierY = 6;

  private shaderThresHold = 0.5;
  private shaderOpacity = 1.0;
  private shaderRange = 0.1;
  private shaderSteps = 30;
  private shaderStartFrame = 0;
  private shaderDiscardOpacity = 0.1;

  private colorWhite = new Color(1, 1, 1);
  private colorClouds = new Color(0.47, 0.54, 0.63);



  /**
   * Размеры объекта облака
   * @returns {CoordDto} параметры размера объекта по осям [X;Y;Z]
   */
  private get getCloudsMeshSize(): CoordDto {
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const mapBorderSizeX = (mapWidth * this.landscape3DService.outSideRepeat) * this.settings3DService.ceilSize;
    const mapBorderSizeZ = (mapHeight * this.landscape3DService.outSideRepeat) * this.settings3DService.ceilSize;
    // Размеры
    return {
      x: this.cloudsMultiplierX * ((mapWidth * this.settings3DService.ceilSize) + (mapBorderSizeX * 2)),
      z: this.cloudsMultiplierZ * ((mapHeight * this.settings3DService.ceilSize) + (mapBorderSizeZ * 2)),
      y: this.cloudsMultiplierY * this.settings3DService.ceilSize
    };
  }

  /**
   * Создание новой текстуры облаков на основе шума перлина
   * @returns {Data3DTexture} новый экземпляр текстуры
   */
  private getCloudsTexture(): Data3DTexture {
    const size = this.noiseSize;
    const sizes = createArray(3, () => size) as [number, number, number];
    const noise = this.dreamMap.noise;
    const vector = new Vector3();
    const texture = new Data3DTexture(new Uint8Array(Math.pow(size, 3)), ...sizes);
    // Цикл по координатам
    XYZForEach(
      ...sizes,
      (x, y, z) => ([
        Math.pow(1 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length(), 2),
        CoordsXYZToIndex(x, y, z, ...sizes),
        x * this.noiseScale,
        y * this.noiseScale,
        z * this.noiseScale
      ]),
      ([d, i, x, y, z]) => texture.image.data[i] = LineFunc(0, MaxColorValue, noise.simplex3(x, y, z), -1, 1) * d
    );
    // Свойства текстуры
    texture.format = RedFormat;
    texture.minFilter = LinearMipMapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.repeat = new Vector2(1, 1);
    // Новая текстура
    return texture;
  }



  constructor(
    private landscape3DService: Landscape3DService,
    private settings3DService: Settings3DService
  ) { }



  // Создание неба
  create() {
    this.createSky();
    this.createFog();
    this.createSun();
    this.createClouds();
    this.createAtmosphere();
    // Обновить
    this.updateSky();
  }

  // Создать небосвод
  private createSky() {
    const horizontSize = this.settings3DService.fogFar * 10000;
    const boxSize = this.settings3DService.horizont;
    const sky = new Sky();
    const uniforms: CustomObject<IUniform<any>> = {
      ...sky.material.uniforms,
      turbidity: { value: 10 },
      rayleigh: { value: 10 },
      mieCoefficient: { value: 0.005 },
      mieDirectionalG: { value: 0.7 },
    };
    // Настройки
    this.sky = sky;
    this.sky.geometry = new BoxGeometry(horizontSize, horizontSize, horizontSize);
    this.sky.scale.setScalar(boxSize);
    this.sky.material.uniforms = uniforms;
    this.sky.material.side = BackSide;
    this.sky.name = DreamMapSkyName;
  }

  // Создать туман
  private createFog() {
    this.fog = new Fog(
      this.colorWhite,
      this.settings3DService.fogNear,
      this.settings3DService.fogFar
    );
  }

  // Создать солнце
  private createSun() {
    const mapWidth = this.dreamMap.size.width;
    const mapHeight = this.dreamMap.size.height;
    const mapBorderSizeX = (mapWidth * this.landscape3DService.outSideRepeat) * this.settings3DService.ceilSize;
    const mapBorderSizeY = (mapHeight * this.landscape3DService.outSideRepeat) * this.settings3DService.ceilSize;
    const width = (mapWidth * this.settings3DService.ceilSize) + (mapBorderSizeX * 2);
    const height = (mapHeight * this.settings3DService.ceilSize) + (mapBorderSizeY * 2);
    const size = Math.max(width, height);
    // Создание объекта
    this.sun = new DirectionalLight(this.colorWhite, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.needsUpdate = true;
    this.sun.shadow.camera.near = -size;
    this.sun.shadow.camera.far = size;
    this.sun.shadow.camera.top = size / 2;
    this.sun.shadow.camera.left = -size / 2;
    this.sun.shadow.camera.right = size / 2;
    this.sun.shadow.camera.bottom = -size / 2;
    this.sun.shadow.radius = 2;
    this.sun.shadow.bias = 0.00357;
  }

  // Создать атмосферное свечение
  private createAtmosphere() {
    this.atmosphere = new AmbientLight(0xFFFFFF, 0.5);
  }

  // Создать облака
  private createClouds() {
    const { x: sizeX, y: sizeY, z: sizeZ } = this.getCloudsMeshSize;
    const geometry = new BoxGeometry(sizeX, sizeY, sizeZ, 1, 1, 1);
    // Материал облаков
    this.cloudsMaterial = new RawShaderMaterial({
      glslVersion: GLSL3,
      fragmentShader: FragmentShader,
      vertexShader: VertexShader,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        base: ThreeVector3Uniform(this.colorClouds),
        map: ThreeTextureUniform(this.getCloudsTexture()),
        cameraPosition: ThreeVector3Uniform(),
        threshold: ThreeFloatUniform(this.shaderThresHold),
        opacity: ThreeFloatUniform(this.shaderOpacity),
        range: ThreeFloatUniform(this.shaderRange),
        steps: ThreeFloatUniform(this.shaderSteps),
        frame: ThreeFloatUniform(this.shaderStartFrame),
        boxSize: ThreeVector3Uniform(sizeX, sizeY, sizeZ),
        fogNear: ThreeFloatUniform(this.settings3DService.fogNear),
        fogFar: ThreeFloatUniform(this.settings3DService.fogFar),
        discardOpacity: ThreeFloatUniform(this.shaderDiscardOpacity)
      }
    });
    // Настройки
    this.clouds = new Mesh(geometry, this.cloudsMaterial);
    this.clouds.position.setY(this.settings3DService.startHeight + this.settings3DService.cloudsDefaultHeight);
    this.clouds.receiveShadow = true;
    this.clouds.castShadow = true;
  }

  // Обновить время
  updateSky() {
    const time = AngleInRange(this.dreamMap.sky.time);
    const uniforms = this.sky.material.uniforms;
    const sin = Sin(time);
    const cos = Cos(time);
    const absCos = Math.abs(cos);
    const isDay = cos < 0 || (sin < 0 && cos === 0);
    const settingsKey: DayType = isDay
      ? "day"
      : "night";
    const absSin = isDay
      ? sin
      : sin * -1;
    const shadowQuality = anyToInt(this.dreamMapSettings?.shadowQuality);
    // Настраиваемые параметры
    const azimuth = LineFunc(SkySettings.azimuth[settingsKey].min, SkySettings.azimuth[settingsKey].max, absSin, -1, 1);
    const elevation = LineFunc(SkySettings.elevation[settingsKey].min, SkySettings.elevation[settingsKey].max, absCos, 0, 1);
    const sunLight = LineFunc(SkySettings.sunLight[settingsKey].min, SkySettings.sunLight[settingsKey].max, absCos, 0, 1);
    const atmosphereLight = LineFunc(SkySettings.atmosphereLight[settingsKey].min, SkySettings.atmosphereLight[settingsKey].max, absCos, 0, 1);
    const atmSkyColorR = LineFunc(SkySettings.atmSkyColorR[settingsKey].min, SkySettings.atmSkyColorR[settingsKey].max, absCos, 0, 1);
    const atmSkyColorG = LineFunc(SkySettings.atmSkyColorG[settingsKey].min, SkySettings.atmSkyColorG[settingsKey].max, absCos, 0, 1);
    const atmSkyColorB = LineFunc(SkySettings.atmSkyColorB[settingsKey].min, SkySettings.atmSkyColorB[settingsKey].max, absCos, 0, 1);
    const turbidity = LineFunc(SkySettings.turbidity[settingsKey].min, SkySettings.turbidity[settingsKey].max, absCos, 0, 1);
    const rayleigh = LineFunc(SkySettings.rayleigh[settingsKey].min, SkySettings.rayleigh[settingsKey].max, absCos, 0, 1);
    const mieCoefficient = LineFunc(SkySettings.mieCoefficient[settingsKey].min, SkySettings.mieCoefficient[settingsKey].max, absCos, 0, 1);
    const mieDirectionalG = LineFunc(SkySettings.mieDirectionalG[settingsKey].min, SkySettings.mieDirectionalG[settingsKey].max, absCos, 0, 1);
    // Прочие параметры
    const phi = AngleToRad(90 - elevation);
    const theta = AngleToRad(azimuth);
    const sunPosition = new Vector3();
    const shadowSize = this.settings3DService.shadowQualitySize * clamp(
      shadowQuality,
      this.settings3DService.mapMaxShadowQuality,
      this.settings3DService.mapMinShadowQuality
    );
    // Обновить данные
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms.sunPosition.value = sunPosition;
    uniforms.turbidity.value = turbidity;
    uniforms.rayleigh.value = rayleigh;
    uniforms.mieCoefficient.value = mieCoefficient;
    uniforms.mieDirectionalG.value = mieDirectionalG;
    this.sun.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
    this.sun.intensity = sunLight;
    this.sun.shadow.mapSize.width = shadowSize;
    this.sun.shadow.mapSize.height = shadowSize;
    this.atmosphere.intensity = atmosphereLight;
    this.atmosphere.color = new Color(atmSkyColorR, atmSkyColorG, atmSkyColorB);
    // Обновить карту теней
    if (!!this.sun.shadow?.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
  }



  /**
   * Анимация
   */
  onAnimate({ camera }: AnimationData) {
    const uniforms = this.cloudsMaterial?.uniforms;
    if (!!uniforms && !!uniforms.cameraPosition) {
      uniforms.cameraPosition = ThreeVector3Uniform(camera.position);
      uniforms.frame = { value: anyToInt(uniforms?.frame?.value) + 1 };
    }
  }
}





// Настройки
type SettingsVars = "azimuth"
  | "elevation"
  | "sunLight"
  | "atmosphereLight"
  | "turbidity"
  | "rayleigh"
  | "exposure"
  | "mieCoefficient"
  | "mieDirectionalG"
  | "atmSkyColorR"
  | "atmSkyColorB"
  | "atmSkyColorB"
  | "atmGroundColorR"
  | "atmGroundColorB"
  | "atmGroundColorB";

type DayType = "day" | "night";

// Настройки
const SkySettings: CustomObjectKey<SettingsVars, CustomObjectKey<DayType, CustomObjectKey<MinMax, number>>> = {
  azimuth: {
    day: { min: -105, max: 105 },
    night: { min: -105, max: 105 }
  },
  elevation: {
    day: { min: 0, max: 75 },
    night: { min: 0, max: 75 }
  },
  sunLight: {
    day: { min: 1.8, max: 1.8 },
    night: { min: 0.7, max: 0.7 }
  },
  atmosphereLight: {
    day: { min: 1.4, max: 1.4 },
    night: { min: 0.7, max: 0.7 }
  },
  atmSkyColorR: {
    day: { min: 0.6, max: 0.7 },
    night: { min: 0.1, max: 0.1 }
  },
  atmSkyColorG: {
    day: { min: 0.3, max: 0.9 },
    night: { min: 0.1, max: 0.1 }
  },
  atmSkyColorB: {
    day: { min: 0, max: 1 },
    night: { min: 0.1, max: 0.1 }
  },
  turbidity: {
    day: { min: 0, max: 0 },
    night: { min: 0.05, max: 0.1 }
  },
  rayleigh: {
    day: { min: 2.4, max: 0.08 },
    night: { min: 0, max: 0 }
  },
  mieCoefficient: {
    day: { min: 1, max: 1 },
    night: { min: 0.005, max: 0.005 }
  },
  mieDirectionalG: {
    day: { min: 0, max: 0 },
    night: { min: 0.7, max: 0.7 }
  },
};
