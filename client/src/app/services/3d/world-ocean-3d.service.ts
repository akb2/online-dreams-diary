import { DreamMapOceanName } from "@_datas/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamWorldOceanFlowSpeed } from "@_datas/dream-map-settings";
import { WorldOceanDefines, WorldOceanFragmentShader, WorldOceanUniforms, WorldOceanVertexShader } from "@_datas/three.js/shaders/ocean.shader";
import { AngleToRad, ParseFloat, ParseInt } from "@_helpers/math";
import { DreamMap } from "@_models/dream-map";
import { Injectable } from "@angular/core";
import { DoubleSide, Mesh, PlaneGeometry, ShaderMaterial, Vector3, WebGLRenderer } from "three";
import { Engine3DService } from "./engine-3d.service";
import { Landscape3DService } from "./landscape-3d.service";
import { Sky3DService } from "./sky-3d.service";



@Injectable()
export class WorldOcean3DService {
  dreamMap: DreamMap;
  renderer: WebGLRenderer;

  ocean: Mesh;

  private geometry: PlaneGeometry;
  private material: ShaderMaterial;

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
    this.geometry = new PlaneGeometry(totalWidth * DreamCeilSize, totalHeight * DreamCeilSize, 1, 1);
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
    this.material = new ShaderMaterial({
      uniforms: WorldOceanUniforms,
      fragmentShader: WorldOceanFragmentShader,
      vertexShader: WorldOceanVertexShader,
      side: DoubleSide,
      defines: WorldOceanDefines,
      transparent: true,
      wireframe: false,
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



  /**
   * Анимация
   */
  onAnimate(): void {
    const uniforms = this.material?.uniforms;

    if (!!uniforms) {
      uniforms.uTime.value = ParseFloat(uniforms.uTime?.value, 0, 20) + this.engine3DService.clock.getDelta();
    }
  }
}
