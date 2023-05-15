import { DreamFogFar } from "@_datas/dream-map-settings";
import { InstancedDistanceShaderKey, InstancedShader, InstancedShearShaderKey } from "@_datas/three.js/shaders/instanced-mesh.shader";
import { ParseFloat } from "@_helpers/math";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { BufferGeometry, InstancedBufferAttribute, InstancedMesh, Material, Vector3 } from "three";





export class ShearableInstancedMesh extends InstancedMesh {

  instanceShear: InstancedBufferAttribute;
  instanceDistance: InstancedBufferAttribute;





  constructor(params: ShearableInstancedMeshParams) {
    AddMaterialBeforeCompile(params.material, shader => shader = InstancedShader(shader, ParseFloat(params.noize, 0, 5)));
    // Родительский конструктор
    super(params.geometry, params.material, params.count);
    // Объявить аттрибуты
    this.instanceShear = new InstancedBufferAttribute(new Float32Array(params.count * 3), 3);
    this.instanceDistance = new InstancedBufferAttribute(new Float32Array(params.count), 1);
    // Установить аттрибуты
    this.geometry.setAttribute(InstancedShearShaderKey, this.instanceShear);
    this.geometry.setAttribute(InstancedDistanceShaderKey, this.instanceDistance);
  }





  // Установить матрицы преобразования
  setShearAt(index: number, shear: Vector3): void {
    this.instanceShear.setXYZ(index, shear.x, shear.y, shear.z);
    this.instanceShear.needsUpdate = true;
  }

  // Установить матрицы расстояния
  setDistanceAt(index: number, distance: number = DreamFogFar / 2): void {
    this.instanceDistance.setX(index, distance);
    this.instanceDistance.needsUpdate = true;
  }





  // Получить матрицы преобразования
  getShearAt(index: number, shear: Vector3): void {
    const shearAttribute: InstancedBufferAttribute = this.geometry.getAttribute(InstancedShearShaderKey) as InstancedBufferAttribute;
    const target: Vector3 = new Vector3();
    // Добавить матрицу
    target.fromArray(shearAttribute.array as number[], index * 3);
    // Вернуть матрицу
    shear.copy(target);
  }

  // Получить матрицы преобразования
  getDistanceAt(index: number): number {
    const attribute: InstancedBufferAttribute = this.geometry.getAttribute(InstancedDistanceShaderKey) as InstancedBufferAttribute;
    // Вернуть матрицу
    return attribute.getX(index);
  }
}





// Параметры
export interface ShearableInstancedMeshParams {
  geometry: BufferGeometry;
  material: Material;
  count: number;
  noize?: number;
}
