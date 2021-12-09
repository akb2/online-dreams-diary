import { Injectable } from "@angular/core";
import { MapSkyBox } from "@_models/dream";
import { ScreenService } from "@_services/screen.service";
import { CubeTexture, CubeTextureLoader, DirectionalLight } from "three";





@Injectable({ providedIn: "root" })

export class SkyBoxService {


  private path: string = "../../assets/dream-map/skybox/";
  private sides: string[] = ["front", "back", "top", "bottom", "left", "right"];
  private size: number = 10000;


  constructor(
    private screenService: ScreenService
  ) { }


  // Объект для отрисовки
  getObject(id: number): SkyBoxResult {
    const skyBoxData: MapSkyBox = SkyBoxes.find(s => s.id === id) || SkyBoxes[0];
    const path: string = this.path + skyBoxData.name + "/";
    // Освещение
    const lights: DirectionalLight[] = [
      new DirectionalLight(0xFFFFFF, 2),
      new DirectionalLight(0xFFFFFF, 0.5),
      new DirectionalLight(0xFFFFFF, 0.5),
      new DirectionalLight(0xFFFFFF, 0.5)
    ];
    lights[0].position.set(0, this.size / 2, -this.size / 2);
    lights[1].position.set(0, -this.size / 2, this.size / 2);
    lights[2].position.set(-this.size / 2, 0, -this.size / 2);
    lights[3].position.set(this.size / 2, 0, -this.size / 2);
    // Объект неба
    const skyBox: CubeTexture = new CubeTextureLoader().setPath(path).load(this.sides.map(s => s + ".jpg"));
    // Вернуть небо
    return { skyBox, light: lights };
  }
}





// Интерфейс скайбокса
export interface SkyBoxResult {
  skyBox: CubeTexture;
  light: DirectionalLight[];
}

// Список небес
export const SkyBoxes: MapSkyBox[] = [{
  id: 1,
  name: "land",
  title: "Зеленое поле в ясный день"
}];