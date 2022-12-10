import { CustomObject } from "@_models/app";
import { MathRound } from "@_models/math";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";





export class TriangleGeometry extends BufferGeometry {


  parameters: TriangleGeometryParameters;

  override type: string = "TriangleGeometry";





  // Преобразование в массив чисел
  private vector3ToNumber(...vectors: Vector3[]): number[] {
    return vectors.map(({ x, y, z }) => ([x, y, z])).reduce((o, v) => ([...o, ...v]), []);
  }





  /**
   * @param [sideA] — Левый катет.
   * @param [sideB] — Гипотенуза в основании.
   * @param [sideC] — Правый катет (если не указывать, то высчитается автоматически по формуле прямоугольных треугольников).
   */
  constructor(sideA: number, sideB: number, sideC?: number, segments?: number) {
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
    let uvs: number[] = [];
    let position: number[] = [];
    let normal: number[] = [];
    let indexes: number[] = [];
    // Параметры: два сегмент
    if (segments === 2) {
      const d: Vector3 = new Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      const dirAC: Vector3 = new Vector3().subVectors(c, a).normalize();
      const dirDA: Vector3 = new Vector3().subVectors(a, d).normalize();
      const dirDB: Vector3 = new Vector3().subVectors(b, d).normalize();
      const dirCD: Vector3 = new Vector3().subVectors(d, c).normalize();
      // Параметры
      uvs = [0, 0, 0.5, 0, 1, 0, cX / sideB, 1];
      position = this.vector3ToNumber(a, d, b, c);
      normal = this.vector3ToNumber(dirDA, dirAC, dirCD, dirDB, dirBC, dirCD);
      indexes = [1, 0, 3, 1, 2, 3];
    }
    // Параметры: один сегмент
    else {
      uvs = [0, 0, 1, 0, cX / sideB, 1];
      position = this.vector3ToNumber(a, b, c);
      normal = this.vector3ToNumber(dirAB, dirBC, dirCA);
      indexes = [0, 1, 2];
      segments = 1;
    }
    // Свойства
    this.parameters = { sideA, sideB, sideC, segments };
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
  segments: number;
}
