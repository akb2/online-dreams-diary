import { DreamMapOceanName } from "@_datas/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamWorldOceanFlowSpeed } from "@_datas/dream-map-settings";
import { WorldOceanFogShader } from "@_datas/three.js/shaders/ocean.shader";
import { AngleToRad, ParseInt } from "@_helpers/math";
import { DreamMap } from "@_models/dream-map";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { Injectable } from "@angular/core";
import { FrontSide, PlaneGeometry, RepeatWrapping, TextureLoader, Vector3, WebGLRenderer } from "three";
import { Water } from "three/examples/jsm/objects/Water";
import { Engine3DService } from "./engine-3d.service";
import { Landscape3DService } from "./landscape-3d.service";
import { Sky3DService } from "./sky-3d.service";



@Injectable()
export class WorldOcean3DService {
  dreamMap: DreamMap;
  renderer: WebGLRenderer;

  ocean: Water;

  private geometry: PlaneGeometry;

  private readonly oceanFlowSpeed = DreamWorldOceanFlowSpeed;
  private readonly heightPart = DreamCeilSize / DreamCeilParts;



  constructor(
    private landscape3DService: Landscape3DService,
    private engine3DService: Engine3DService,
    private sky3DService: Sky3DService
  ) { }



  /**
   * Создание окен
   */
  create(): void {
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
    const sunDirection = new Vector3().subVectors(this.sky3DService.sun.position, position).normalize();
    // Создание объекта
    this.geometry = new PlaneGeometry(totalWidth * DreamCeilSize, totalHeight * DreamCeilSize, 1, 1);
    this.ocean = new Water(this.geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new TextureLoader().load("../../assets/dream-map/water/ocean.jpg", texture => texture.wrapS = texture.wrapT = RepeatWrapping),
      sunColor: this.sky3DService.sun.color,
      eye: this.engine3DService.camera.position,
      waterColor: 0x004587,
      distortionScale: 2,
      fog: true,
      sunDirection,
      side: FrontSide,
      alpha: 1
    });
    // Свойства
    this.ocean.material.transparent = true;
    this.ocean.material.alphaTest = 0;
    this.ocean.material.depthTest = true;
    this.ocean.material.depthWrite = true;
    this.ocean.rotation.x = AngleToRad(-90);
    this.ocean.position.set(position.x, position.y, position.z);
    this.ocean.material.uniforms.size.value = DreamCeilSize * 10;
    this.ocean.receiveShadow = true;
    this.ocean.name = DreamMapOceanName;
    // Туман
    AddMaterialBeforeCompile(this.ocean.material, WorldOceanFogShader);
  }

  /**
   * Обновить время
   */
  updateWorldOcean(): void {
    const z = this.heightPart * this.dreamMap.ocean.z;
    // Свойства
    this.ocean.position.setY(z);
  }



  /**
   * Анимация
   */
  onAnimate(): void {
    const uniforms = this.ocean.material?.uniforms;

    if (!!uniforms) {
      // Обновить воду
      uniforms.time.value += this.heightPart * (this.oceanFlowSpeed / 10);
    }
  }
}
