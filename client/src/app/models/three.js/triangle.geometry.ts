import { CustomObject, MathRound } from "@_models/app";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";





export class TriangleGeometry extends BufferGeometry {


  parameters: TriangleGeometryParameters;

  override type: string = "TriangleGeomtry";





  /**
   * @param [sideA] — Левый катет.
   * @param [sideB] — Гипотенуза в основании.
   * @param [sideC] — Правый катет (если не указывать, то высчитается автоматически по формуле прямоугольных треугольников).
   */
  constructor(sideA: number, sideB: number, sideC?: number) {
    super();
    // Правый катет
    sideC = sideC ?? Math.sqrt(Math.pow(sideA, 2) - Math.pow(sideB, 2));
    // Углы
    // ? cX: Координата X угла: верхний
    // ? a: Координаты угла: нижний левый
    // ? b: Координаты угла: нижний правый
    // ? c: Координаты угла: верхний
    const cX: number = MathRound((Math.pow(sideA, 2) + Math.pow(sideB, 2) - Math.pow(sideC, 2)) / (2 * sideB), 10);
    const cY: number = MathRound(Math.sqrt((sideC * sideC) - (cX * cX)), 10);
    const a: Vector3 = new Vector3(-sideB / 2, 0, 0);
    const b: Vector3 = new Vector3(sideB / 2, 0, 0);
    const c: Vector3 = new Vector3(cX - (sideB / 2), cY, 0);
    const dirAB: Vector3 = new Vector3().subVectors(b, a).normalize();
    const dirBC: Vector3 = new Vector3().subVectors(c, b).normalize();
    const dirCA: Vector3 = new Vector3().subVectors(a, c).normalize();
    // Параметры
    const uvs: number[] = [0, 0, 1, 0, cX / sideB, 1];
    const position: number[] = [a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z];
    const normal: number[] = [dirAB.x, dirAB.y, dirAB.z, dirBC.x, dirBC.y, dirBC.z, dirCA.x, dirCA.y, dirCA.z,];
    const indexes: number[] = [0, 1, 2];
    // Свойства
    this.parameters = { sideA, sideB, sideC };
    this.setIndex(indexes);
    this.setAttribute("position", new Float32BufferAttribute(position, 3));
    this.setAttribute("normal", new Float32BufferAttribute(normal, 3));
    this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    this.setAttribute("uv2", new Float32BufferAttribute(uvs, 2));
  }





  // Получение геометрии из JSON данных
  static fromJSON(data: CustomObject<number>): TriangleGeometry {
    return new TriangleGeometry(
      data.sideA ?? 1,
      data.sideB ?? 1,
      data.sideC ?? 1,
    );
  }
}





// Интерфейс параметров
interface TriangleGeometryParameters {
  sideA: number;
  sideB: number;
  sideC: number;
}
