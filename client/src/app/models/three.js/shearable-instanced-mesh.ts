import { BufferGeometry, InstancedBufferAttribute, InstancedMesh, Material, Shader, Vector3 } from "three";





export class ShearableInstancedMesh extends InstancedMesh {
  instanceShear: InstancedBufferAttribute;

  constructor(geometry: BufferGeometry, material: Material, count: number) {
    const customMaterial = material.clone();
    // Вершинный шейдер
    customMaterial.onBeforeCompile = shader => shader = VertexShader(shader);
    // Родительский конструктор
    super(geometry, customMaterial, count);
    // Параметры
    const shearMatrices = new Float32Array(count * 3);
    // Установить аттрибуты
    this.instanceShear = new InstancedBufferAttribute(shearMatrices, 3);
    this.geometry.setAttribute("shearMatrix", this.instanceShear);
  }

  // Установить матрицы преобразования
  setShearAt(index: number, shear: Vector3): void {
    this.instanceShear.setXYZ(index, shear.x, shear.y, shear.z);
    this.instanceShear.needsUpdate = true;
  }

  // Получить матрицы преобразования
  getShearAt(index: number, shear: Vector3): void {
    const shearAttribute: InstancedBufferAttribute = this.geometry.getAttribute("shearMatrix") as InstancedBufferAttribute;
    const target: Vector3 = new Vector3();
    // Добавить матрицу
    target.fromArray(shearAttribute.array as number[], index * 3);
    // Вернуть матрицу
    shear.copy(target);
  }
}





// Вершинный шейдер
const VertexShader = (shader: Shader) => {
  shader.vertexShader = shader.vertexShader.replace("#include <common>", `
    #include <common>

    attribute vec3 shearMatrix;
  `);
  // Изменить тело
  shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
    vec4 mvPosition = vec4(transformed, 1.0);

    #ifdef USE_INSTANCING
      mat4 skewMatrix = mat4(
        1.0, shearMatrix.y, shearMatrix.z, 0.0,
        shearMatrix.x, 1.0, shearMatrix.z, 0.0,
        shearMatrix.x, -shearMatrix.y, 1.0, 0.0,
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
  // Вернуть шейдер
  return shader;
}
