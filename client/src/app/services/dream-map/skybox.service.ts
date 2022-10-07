import { Injectable } from "@angular/core";
import { MapSkyBox, SkyBoxLightTarget } from "@_models/dream-map";
import { CameraHelper, CubeTexture, CubeTextureLoader, DirectionalLight, Fog, HemisphereLight, Light } from "three";





@Injectable()

export class SkyBoxService {


  private path: string = "../../assets/dream-map/skybox/";
  private sides: string[] = ["front", "back", "top", "bottom", "left", "right"];





  // Объект для отрисовки
  getObject(id: number, distance: number, size: number): SkyBoxResult {
    const skyBoxData: MapSkyBox = SkyBoxes.find(s => s.id === id) || SkyBoxes[0];
    const path: string = this.path + skyBoxData.name + "/";
    const color: number = 0xA6C6DB;
    // Освещение
    const lights: LightExport[] = skyBoxData.lights.map(({ light, position, shadow, target }) => {
      let helper: CameraHelper;
      // Позиция
      if (!!position) {
        const { x, y, z } = position;
        light.position.set(x, y, z);
      }
      // Тень
      if (!!shadow && light instanceof DirectionalLight) {
        light.castShadow = true;
        light.shadow.needsUpdate = true;
        // Свойства тени
        light.shadow.camera.near = shadow.near;
        light.shadow.camera.far = shadow.far;
        light.shadow.camera.top = shadow.top;
        light.shadow.camera.left = shadow.left;
        light.shadow.camera.right = shadow.right;
        light.shadow.camera.bottom = shadow.bottom;
        light.shadow.mapSize.width = shadow.width;
        light.shadow.mapSize.height = shadow.height;
        light.shadow.radius = shadow.radius;
        light.shadow.bias = shadow.bias;
        helper = new CameraHelper(light.shadow.camera);
      }
      // Результат
      return { light, target, helper };
    });
    // Туман
    const fog: Fog = new Fog(color, (distance * skyBoxData.fogDistance) * size, distance * size);
    // Объект неба
    const skyBox: CubeTexture = new CubeTextureLoader().setPath(path).load(this.sides.map(s => s + ".jpg"));
    // Вернуть небо
    return { fog, skyBox, light: lights };
  }
}





// Размер карты
const BoxSize: number = 100;

// Интерфейс скайбокса
export interface SkyBoxResult {
  fog: Fog;
  skyBox: CubeTexture;
  light: LightExport[];
}

// Объект освещений
export interface LightExport {
  light: Light;
  target: SkyBoxLightTarget;
  helper: CameraHelper;
}

// Список небес
export const SkyBoxes: MapSkyBox[] = [{
  id: 1,
  name: "land",
  title: "Ясный день",
  fogColor: 0xA6C6DB,
  fogDistance: 0.5,
  lights: [{
    light: new DirectionalLight(0xFFFFFF, 1.1),
    fixed: true,
    target: SkyBoxLightTarget.Scene,
    position: {
      x: 0.2,
      y: 0.5,
      z: -2,
    },
    shadow: {
      near: -BoxSize,
      far: BoxSize,
      top: BoxSize / 2,
      left: -BoxSize / 2,
      right: BoxSize / 2,
      bottom: -BoxSize / 2,
      width: 512,
      height: 512,
      radius: 5,
      bias: 0.00357
    }
  }, {
    light: new HemisphereLight(0xA6C6DB, 0xFFFFFF, 0.4),
    target: SkyBoxLightTarget.Scene
  }]
}];
