import { Injectable } from "@angular/core";
import { MapSkyBox, SkyBoxLightTarget } from "@_models/dream";
import { AmbientLight, CameraHelper, CubeTexture, CubeTextureLoader, DirectionalLight, Fog, Light } from "three";





@Injectable({ providedIn: "root" })

export class SkyBoxService {


  private path: string = "../../assets/dream-map/skybox/";
  private sides: string[] = ["front", "back", "top", "bottom", "left", "right"];





  // Объект для отрисовки
  getObject(id: number, distance: number, size: number): SkyBoxResult {
    const skyBoxData: MapSkyBox = SkyBoxes.find(s => s.id === id) || SkyBoxes[0];
    const path: string = this.path + skyBoxData.name + "/";
    const color: number = 0xA6C6DB;
    const helpers: CameraHelper[] = [];
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
        helper = new CameraHelper(light.shadow.camera);
      }
      // Результат
      return { light, target, helper };
    });
    // Туман
    const fog: Fog = new Fog(color, (distance * 0.7) * size, distance * size);
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
  lights: [{
    light: new DirectionalLight(0xFFFFFF, 1.1),
    fixed: true,
    target: SkyBoxLightTarget.Scene,
    position: {
      x: 0.1,
      y: 1,
      z: -1,
    },
    shadow: {
      near: -BoxSize,
      far: BoxSize,
      top: BoxSize / 2,
      left: -BoxSize / 2,
      right: BoxSize / 2,
      bottom: -BoxSize / 2,
      width: BoxSize * 2000,
      height: BoxSize * 2000,
      radius: 1
    }
  }, {
    light: new AmbientLight(0xA6C6DB, 0.7),
    target: SkyBoxLightTarget.Scene
  }]
}];