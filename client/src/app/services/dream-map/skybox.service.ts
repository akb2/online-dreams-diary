import { Injectable } from "@angular/core";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { DreamCeilSize, DreamFogFar, DreamFogNear, DreamHorizont, DreamObjectDetalization } from "@_models/dream-map-settings";
import { AngleToRad, Cos, LineFunc } from "@_helpers/math";
import { BackSide, BoxGeometry, BufferGeometry, Color, DirectionalLight, Fog, HemisphereLight, IUniform, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { Sky } from "three/examples/jsm/objects/Sky";





@Injectable()

export class DreamMapSkyBoxService {



  private shadowMinSize: number = 512;
  private shadowMaxSize: number = 4096;

  private renderer: WebGLRenderer;
  private sky: Sky;
  private sun: DirectionalLight;
  private atmosphere: HemisphereLight;





  // Объект для отрисовки
  getObject(renderer: WebGLRenderer, size: number, time: number): SkyBoxOutput {
    const color: Color | number = new Color(1, 1, 1);
    const sky: Sky = new Sky();
    const sun: DirectionalLight = new DirectionalLight(color, 1.2);
    const atmosphere: HemisphereLight = new HemisphereLight(0xFFFFFF, 0x000000, 0.5);
    const fog: Fog = new Fog(color, FogNear * DreamCeilSize, FogFar * DreamCeilSize);
    const boxSize: number = DreamHorizont;
    const uniforms: CustomObject<IUniform<any>> = {
      ...sky.material.uniforms,
      turbidity: { value: 10 },
      rayleigh: { value: 10 },
      mieCoefficient: { value: 0.005 },
      mieDirectionalG: { value: 0.7 },
    };
    // Настройка тени
    let shadowSize: number = Math.pow(2, DreamObjectDetalization + 6);
    shadowSize = shadowSize < this.shadowMinSize ? this.shadowMinSize : shadowSize;
    shadowSize = shadowSize > this.shadowMaxSize ? this.shadowMaxSize : shadowSize;
    // Настройки
    sky.geometry = new SphereGeometry(1, 32, 16) as BufferGeometry as BoxGeometry;
    sky.scale.setScalar(boxSize);
    sky.material.uniforms = uniforms;
    sky.material.side = BackSide;
    // Настройки освещения
    sun.castShadow = true;
    sun.shadow.needsUpdate = true;
    // Свойства тени
    sun.shadow.camera.near = -size;
    sun.shadow.camera.far = size;
    sun.shadow.camera.top = size / 2;
    sun.shadow.camera.left = -size / 2;
    sun.shadow.camera.right = size / 2;
    sun.shadow.camera.bottom = -size / 2;
    sun.shadow.mapSize.width = shadowSize;
    sun.shadow.mapSize.height = shadowSize;
    sun.shadow.radius = 5;
    sun.shadow.bias = 0.00357;
    // Сохранить параметры
    this.sky = sky;
    this.sun = sun;
    this.atmosphere = atmosphere;
    this.renderer = renderer;
    // Подсчитать данные
    this.setSkyTime(time);
    // Вернуть небо
    return { sky, sun, fog, atmosphere };
  }





  // Подсчитать положение
  setSkyTime(time: number): void {
    const calc: (num: number, min: number, max: number) => number = (num: number, min: number, max: number) => ((min - max) * num) + max;
    // Общие параметры
    const uniforms = this.sky.material.uniforms;
    const valueIndex: number = Math.floor((90 + time) / 180);
    const value: number = (time + 90) - (valueIndex * 180);
    const cosValue: number = Math.abs(Cos(value));
    const isDay: boolean = valueIndex === 1;
    const settingsKey: "day" | "night" = isDay ? "day" : "night";
    // Настраиваемые параметры
    const azimuth: number = calc((Cos(value) + 1) / 2, SkySettings.azimuth[settingsKey].min, SkySettings.azimuth[settingsKey].max);
    const elevation: number = LineFunc(SkySettings.elevation[settingsKey].min, SkySettings.elevation[settingsKey].max, cosValue, 0, 1);
    const turbidity: number = LineFunc(SkySettings.turbidity[settingsKey].min, SkySettings.turbidity[settingsKey].max, cosValue, 0, 1);
    const rayleigh: number = LineFunc(SkySettings.rayleigh[settingsKey].min, SkySettings.rayleigh[settingsKey].max, cosValue, 0, 1);
    const exposure: number = LineFunc(SkySettings.exposure[settingsKey].min, SkySettings.exposure[settingsKey].max, cosValue, 0, 1);
    const sunLight: number = LineFunc(SkySettings.sunLight[settingsKey].min, SkySettings.sunLight[settingsKey].max, cosValue, 0, 1);
    const atmosphereLight: number = LineFunc(SkySettings.atmosphereLight[settingsKey].min, SkySettings.atmosphereLight[settingsKey].max, cosValue, 0, 1);
    const atmSkyColorR: number = LineFunc(SkySettings.atmSkyColorR[settingsKey].min, SkySettings.atmSkyColorR[settingsKey].max, cosValue, 0, 1);
    const atmSkyColorG: number = LineFunc(SkySettings.atmSkyColorG[settingsKey].min, SkySettings.atmSkyColorG[settingsKey].max, cosValue, 0, 1);
    const atmSkyColorB: number = LineFunc(SkySettings.atmSkyColorB[settingsKey].min, SkySettings.atmSkyColorB[settingsKey].max, cosValue, 0, 1);
    const atmGroundColorR: number = LineFunc(SkySettings.atmGroundColorR[settingsKey].min, SkySettings.atmGroundColorR[settingsKey].max, cosValue, 0, 1);
    const atmGroundColorG: number = LineFunc(SkySettings.atmGroundColorG[settingsKey].min, SkySettings.atmGroundColorG[settingsKey].max, cosValue, 0, 1);
    const atmGroundColorB: number = LineFunc(SkySettings.atmGroundColorB[settingsKey].min, SkySettings.atmGroundColorB[settingsKey].max, cosValue, 0, 1);
    const mieCoefficient: number = LineFunc(SkySettings.mieCoefficient[settingsKey].min, SkySettings.mieCoefficient[settingsKey].max, cosValue, 0, 1);
    const mieDirectionalG: number = LineFunc(SkySettings.mieDirectionalG[settingsKey].min, SkySettings.mieDirectionalG[settingsKey].max, cosValue, 0, 1);
    // Прочие параметры
    const phi = AngleToRad(90 - elevation);
    const theta = AngleToRad(azimuth);
    const sunPosition: Vector3 = new Vector3();
    // Обновить данные
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms.sunPosition.value = sunPosition;
    uniforms.turbidity.value = turbidity;
    uniforms.rayleigh.value = rayleigh;
    uniforms.mieCoefficient.value = mieCoefficient;
    uniforms.mieDirectionalG.value = mieDirectionalG;
    this.sun.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
    this.sun.intensity = sunLight;
    this.atmosphere.intensity = atmosphereLight;
    this.atmosphere.color = new Color(atmSkyColorR, atmSkyColorG, atmSkyColorB);
    this.atmosphere.groundColor = new Color(atmGroundColorR, atmGroundColorG, atmGroundColorB);
    this.renderer.toneMappingExposure = exposure;
  }
}





// Интерфейс выходных данных
export interface SkyBoxOutput {
  sky: Sky;
  sun: DirectionalLight;
  atmosphere: HemisphereLight;
  fog: Fog;
}

// Настройки
type SettingsVars = "azimuth" | "elevation" | "sunLight" | "atmosphereLight" | "turbidity" | "rayleigh" | "exposure" | "mieCoefficient" | "mieDirectionalG" | "atmSkyColorR" | "atmSkyColorB" | "atmSkyColorB" | "atmGroundColorR" | "atmGroundColorB" | "atmGroundColorB";
const SkySettings: CustomObjectKey<SettingsVars, CustomObjectKey<"day" | "night", CustomObjectKey<"min" | "max", number>>> = {
  azimuth: {
    day: { min: 110, max: -110 },
    night: { min: 110, max: -110 }
  },
  elevation: {
    day: { min: 0, max: 60 },
    night: { min: 0, max: 60 }
  },
  sunLight: {
    day: { min: 0.7, max: 1.5 },
    night: { min: 0.2, max: 0.2 }
  },
  atmosphereLight: {
    day: { min: 0.4, max: 0.4 },
    night: { min: 0.2, max: 0.2 }
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
  atmGroundColorR: {
    day: { min: 0, max: 0 },
    night: { min: 0.1, max: 0.1 }
  },
  atmGroundColorG: {
    day: { min: 0.4, max: 0.9 },
    night: { min: 0.1, max: 0.1 }
  },
  atmGroundColorB: {
    day: { min: 0, max: 0.1 },
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
    night: { min: 0.1, max: 0.15 }
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

// Дистанции тумана
export const FogNear: number = DreamFogNear;
export const FogFar: number = DreamFogFar;
