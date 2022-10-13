import { Injectable } from "@angular/core";
import { AngleToRad, Cos, CustomObject, Sin } from "@_models/app";
import { DreamCeilSize } from "@_services/dream.service";
import { AmbientLight, BackSide, BoxGeometry, BufferGeometry, Color, DirectionalLight, Fog, IUniform, SphereGeometry, Vector3, WebGLRenderer } from "three";
import { Sky } from "three/examples/jsm/objects/Sky";





@Injectable()

export class DreamMapSkyBoxService {


  private renderer: WebGLRenderer;
  private sky: Sky;
  private sun: DirectionalLight;
  private atmosphere: AmbientLight;





  // Объект для отрисовки
  getObject(renderer: WebGLRenderer, size: number, time: number): SkyBoxOutput {
    const color: Color | number = new Color(1, 1, 1);
    const sky: Sky = new Sky();
    const sun: DirectionalLight = new DirectionalLight(color, 0.8);
    const atmosphere: AmbientLight = new AmbientLight(0xFFFFFF, 0.4);
    const fog: Fog = new Fog(color, FogNear * DreamCeilSize, FogFar * DreamCeilSize);
    const shadowSize: number = 1024;
    const boxSize: number = FogFar * DreamCeilSize / 6;
    const uniforms: CustomObject<IUniform<any>> = {
      ...sky.material.uniforms,
      turbidity: { value: 10 },
      rayleigh: { value: 3 },
      mieCoefficient: { value: 0.005 },
      mieDirectionalG: { value: 0.7 },
    };
    // Настройки
    sky.geometry = new SphereGeometry(boxSize, 32, 16) as BufferGeometry as BoxGeometry;
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
    const minElevation: number = 0;
    const maxElevation: number = 60;
    const minAzimuth: number = 110;
    const maxAzimuth: number = -110;
    // Параметры
    const uniforms = this.sky.material.uniforms;
    const valueIndex: number = Math.floor((90 + time) / 180);
    const value: number = (time + 90) - (valueIndex * 180);
    const calc: (num: number, min: number, max: number) => number = (num: number, min: number, max: number) => ((min - max) * num) + max;
    const azimuth: number = calc((Cos(value) + 1) / 2, minAzimuth, maxAzimuth);
    const elevation: number = calc(Math.abs(1 - Sin(value)), minElevation, maxElevation);
    const phi = AngleToRad(90 - elevation);
    const theta = AngleToRad(azimuth);
    const sunPosition: Vector3 = new Vector3();
    const isDay: boolean = valueIndex === 1;
    const turbidity: number = isDay ? calc(Math.abs(Cos(value)), 5, 0) : 0.1;
    const rayleigh: number = isDay ? 3 : 0;
    const exposure: number = isDay ? 0.4 : 0.2;
    const sunLight: number = isDay ?
      calc(Math.abs(Cos(value)), 0.7, 1) :
      calc(Math.abs(Cos(value)), 0.01, 0.02);
    const atmosphereLight: number = isDay ?
      calc(Math.abs(Cos(value)), 0.05, 0.3) :
      calc(Math.abs(Cos(value)), 0.01, 0.03);
    // Обновить данные
    sunPosition.setFromSphericalCoords(1, phi, theta);
    uniforms.sunPosition.value = sunPosition;
    uniforms.turbidity.value = turbidity;
    uniforms.rayleigh.value = rayleigh;
    this.sun.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
    this.sun.intensity = sunLight;
    this.atmosphere.intensity = atmosphereLight;
    this.renderer.toneMappingExposure = exposure;
  }
}





// Интерфейс выходных данных
export interface SkyBoxOutput {
  sky: Sky;
  sun: DirectionalLight;
  atmosphere: AmbientLight;
  fog: Fog;
}

// Дистанции тумана
export const FogNear: number = 60;
export const FogFar: number = 100;
