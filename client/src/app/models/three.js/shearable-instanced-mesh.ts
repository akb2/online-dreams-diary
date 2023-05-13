import { AddMaterialBeforeCompile } from "@_threejs/base";
import { BufferGeometry, InstancedBufferAttribute, InstancedMesh, Material, Shader, Vector3 } from "three";





export class ShearableInstancedMesh extends InstancedMesh {

  instanceShear: InstancedBufferAttribute;





  constructor(geometry: BufferGeometry, material: Material, count: number) {
    AddMaterialBeforeCompile(material, shader => shader = VertexShader(shader));
    // Родительский конструктор
    super(geometry, material, count);
    // Параметры
    const shearMatrices = new Float32Array(count * 3);
    // Установить аттрибуты
    this.instanceShear = new InstancedBufferAttribute(shearMatrices, 3);
    this.geometry.setAttribute(ShearShaderKey, this.instanceShear);
  }





  // Установить матрицы преобразования
  setShearAt(index: number, shear: Vector3): void {
    this.instanceShear.setXYZ(index, shear.x, shear.y, shear.z);
    this.instanceShear.needsUpdate = true;
  }

  // Получить матрицы преобразования
  getShearAt(index: number, shear: Vector3): void {
    const shearAttribute: InstancedBufferAttribute = this.geometry.getAttribute(ShearShaderKey) as InstancedBufferAttribute;
    const target: Vector3 = new Vector3();
    // Добавить матрицу
    target.fromArray(shearAttribute.array as number[], index * 3);
    // Вернуть матрицу
    shear.copy(target);
  }
}





// Название переменной в шейдере
const ShearShaderKey: string = "customShearMatrix"

// Вершинный шейдер
const VertexShader = (shader: Shader) => {
  if (!(new RegExp(ShearShaderKey, "gmi")).test(shader.vertexShader)) {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>

      attribute vec3 ${ShearShaderKey};
    `);
    // Изменить тело
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
      vec4 mvPosition = vec4(transformed, 1.0);

      #ifdef USE_INSTANCING
        mat4 skewMatrix = mat4(
          1.0, ${ShearShaderKey}.y, ${ShearShaderKey}.z, 0.0,
          ${ShearShaderKey}.x, 1.0, ${ShearShaderKey}.z, 0.0,
          ${ShearShaderKey}.x, -${ShearShaderKey}.y, 1.0, 0.0,
          0.0, 0.0, 0.0, 1.0
        );
        mvPosition = skewMatrix * mvPosition;
        mvPosition = instanceMatrix * mvPosition;
        mvPosition = modelViewMatrix * mvPosition;
      #else
        mvPosition = modelViewMatrix * mvPosition;
      #endif

      gl_Position = projectionMatrix * mvPosition;
    `);
  }
  // Вернуть шейдер
  return shader;
}
