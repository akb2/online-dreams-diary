import { DreamMapSkyName } from "@_datas/dream-map-objects";
import { DefaultDreamMapSettings, DreamCeilSize, DreamFogFar, DreamFogNear, DreamHorizont, DreamMapMaxShadowQuality, DreamMapMinShadowQuality, DreamShadowQualitySize } from "@_datas/dream-map-settings";
import { AngleInRange, AngleToRad, CheckInRange, Cos, LineFunc, ParseInt, Sin } from "@_helpers/math";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { DreamMap, DreamMapSettings } from "@_models/dream-map";
import { MinMax } from "@_models/math";
import { Injectable } from "@angular/core";
import { AmbientLight, BackSide, BoxGeometry, Color, DirectionalLight, Fog, IUniform, Vector3, WebGLRenderer } from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Landscape3DService } from "./landscape-3d.service";





@Injectable()

export class Sky3DService {

  dreamMap: DreamMap;
  dreamMapSettings: DreamMapSettings = DefaultDreamMapSettings;
  renderer: WebGLRenderer;

  sky: Sky;
  fog: Fog;
  sun: DirectionalLight;
  atmosphere: AmbientLight;





  constructor(
    private landscape3DService: Landscape3DService
  ) { }





  // Создание неба
  create(): void {
    const oWidth: number = this.dreamMap.size.width;
    const oHeight: number = this.dreamMap.size.height;
    const borderOSize: number = Math.max(oWidth, oHeight) * this.landscape3DService.outSideRepeat;
    const borderSize: number = borderOSize * DreamCeilSize;
    const width: number = (oWidth * DreamCeilSize) + (borderSize * 2);
    const height: number = (oHeight * DreamCeilSize) + (borderSize * 2);
    const size: number = Math.min(width, height);
    const near: number = DreamFogNear * DreamCeilSize;
    const far: number = DreamFogFar * DreamCeilSize;
    const horizontSize: number = far * 10000;
    const color: Color | number = new Color(1, 1, 1);
    const boxSize: number = DreamHorizont;
    const sky = new Sky();
    const uniforms: CustomObject<IUniform<any>> = {
      ...sky.material.uniforms,
      turbidity: { value: 10 },
      rayleigh: { value: 10 },
      mieCoefficient: { value: 0.005 },
      mieDirectionalG: { value: 0.7 },
    };
    // Создание неба
    this.sky = sky;
    this.sky.geometry = new BoxGeometry(horizontSize, horizontSize, horizontSize);
    this.sky.scale.setScalar(boxSize);
    this.sky.material.uniforms = uniforms;
    this.sky.material.side = BackSide;
    this.sky.name = DreamMapSkyName;
    // Сроздание тумана
    this.fog = new Fog(color, near, far);
    // Сроздание основного света
    this.sun = new DirectionalLight(color, 1.2);
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
    // Создание атмосферного свечения
    this.atmosphere = new AmbientLight(0xFFFFFF, 0.5);
    // Подсчитать данные
    this.updateSky();
  }

  // Обновить время
  updateSky(): void {
    const time = AngleInRange(this.dreamMap.sky.time);
    const uniforms = this.sky.material.uniforms;
    const sin = Sin(time);
    const cos = Cos(time);
    const absCos: number = Math.abs(cos);
    const isDay = cos < 0 || (sin < 0 && cos === 0);
    const settingsKey: DayType = isDay ? "day" : "night";
    const absSin: number = isDay ? sin : sin * -1;
    const shadowQuality = ParseInt(this.dreamMapSettings?.shadowQuality);
    // Настраиваемые параметры
    const azimuth: number = LineFunc(SkySettings.azimuth[settingsKey].min, SkySettings.azimuth[settingsKey].max, absSin, -1, 1);
    const elevation: number = LineFunc(SkySettings.elevation[settingsKey].min, SkySettings.elevation[settingsKey].max, absCos, 0, 1);
    const sunLight: number = LineFunc(SkySettings.sunLight[settingsKey].min, SkySettings.sunLight[settingsKey].max, absCos, 0, 1);
    const atmosphereLight: number = LineFunc(SkySettings.atmosphereLight[settingsKey].min, SkySettings.atmosphereLight[settingsKey].max, absCos, 0, 1);
    const atmSkyColorR: number = LineFunc(SkySettings.atmSkyColorR[settingsKey].min, SkySettings.atmSkyColorR[settingsKey].max, absCos, 0, 1);
    const atmSkyColorG: number = LineFunc(SkySettings.atmSkyColorG[settingsKey].min, SkySettings.atmSkyColorG[settingsKey].max, absCos, 0, 1);
    const atmSkyColorB: number = LineFunc(SkySettings.atmSkyColorB[settingsKey].min, SkySettings.atmSkyColorB[settingsKey].max, absCos, 0, 1);
    const turbidity: number = LineFunc(SkySettings.turbidity[settingsKey].min, SkySettings.turbidity[settingsKey].max, absCos, 0, 1);
    const rayleigh: number = LineFunc(SkySettings.rayleigh[settingsKey].min, SkySettings.rayleigh[settingsKey].max, absCos, 0, 1);
    const exposure: number = LineFunc(SkySettings.exposure[settingsKey].min, SkySettings.exposure[settingsKey].max, absCos, 0, 1);
    const mieCoefficient: number = LineFunc(SkySettings.mieCoefficient[settingsKey].min, SkySettings.mieCoefficient[settingsKey].max, absCos, 0, 1);
    const mieDirectionalG: number = LineFunc(SkySettings.mieDirectionalG[settingsKey].min, SkySettings.mieDirectionalG[settingsKey].max, absCos, 0, 1);
    // Прочие параметры
    const phi = AngleToRad(90 - elevation);
    const theta = AngleToRad(azimuth);
    const sunPosition: Vector3 = new Vector3();
    const shadowSize: number = DreamShadowQualitySize * CheckInRange(shadowQuality, DreamMapMaxShadowQuality, DreamMapMinShadowQuality);
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
    this.renderer.toneMappingExposure = exposure;
    // Обновить карту теней
    if (!!this.sun.shadow?.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
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
    day: { min: -15, max: 195 },
    night: { min: -15, max: 195 }
  },
  elevation: {
    day: { min: 0, max: 60 },
    night: { min: 0, max: 60 }
  },
  sunLight: {
    day: { min: 0.4, max: 1 },
    night: { min: 0.4, max: 0.45 }
  },
  atmosphereLight: {
    day: { min: 0.2, max: 0.8 },
    night: { min: 0.2, max: 0.3 }
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
    day: { min: 5, max: 0 },
    night: { min: 0.05, max: 0.1 }
  },
  rayleigh: {
    day: { min: 3, max: 0.2 },
    night: { min: 0, max: 0 }
  },
  exposure: {
    day: { min: 0.2, max: 0.4 },
    night: { min: 0.1, max: 0.2 }
  },
  mieCoefficient: {
    day: { min: 0.005, max: 0 },
    night: { min: 0.005, max: 0.005 }
  },
  mieDirectionalG: {
    day: { min: 0.8, max: 0.99 },
    night: { min: 0.7, max: 0.7 }
  },
};
