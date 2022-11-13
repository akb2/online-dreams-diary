import { AngleToRad, CreateArray, IsEven, IsMultiple, Random } from "@_models/app";
import { ClosestHeight, ClosestHeights, DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxElmsCount, DreamMaxHeight, DreamObjectDetalization, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TriangleGeometry } from "@_models/three.js/triangle.geometry";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { MapObject, ObjectSetting } from "@_services/dream-map/object.service";
import { CheckCeilForm } from "@_services/dream-map/objects/grass/_functions";
import { AllCorners, AnglesB, CeilGrassFillGeometry, ClosestKeysAll } from "@_services/dream-map/objects/grass/_models";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { BufferGeometry, CircleGeometry, Clock, Color, DataTexture, DoubleSide, Float32BufferAttribute, Matrix4, Mesh, MeshPhongMaterial, Object3D, PlaneGeometry, Ray, Shader, Side, Triangle, Vector3 } from "three";





export class DreamMapPlantainGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights): string {
    const closestCeils: ClosestHeight[] = ClosestKeysAll.map(k => neighboringCeils[k]).filter(c => c.terrain === ceil.terrain);
    const closestCount: number = closestCeils.length;
    const closestKeys: (keyof ClosestHeights)[] = ClosestKeysAll.filter(k => neighboringCeils[k].terrain === ceil.terrain);
    // Отрисовка только для существующих типов фигур
    if (closestCount < CeilGrassFillGeometry.length && !!CeilGrassFillGeometry[closestCount]) {
      // Для ячеек без похожих соседних ячеек
      if (closestCount === 0) {
        return "circle";
      }
      // Для ячеек с одной похожей геометрией
      else if (closestCount === 1) {
        return "half-circle";
      }
      // Для ячеек с двумя похожими геометриями
      else if (closestCount === 2) {
        const angle: number = AnglesB[closestKeys[0]][closestKeys[1]] ?? -1;
        // Обрабатывать только те ячейки где одинаковые соседние типы местности в разных координатах
        if (angle >= 0) {
          const corners: (keyof ClosestHeights)[] = AllCorners[closestKeys[0]][closestKeys[1]];
          const cornersCount: number = corners.map(k => neighboringCeils[k]).filter(c => c.terrain === ceil.terrain).length;
          // Посчитать
          return cornersCount > 0 ? "triangle" : "quarter-ceil";
        }
      }
    }
    // Полная геометрия
    return "square";
  }





  private count: number = DreamObjectDetalization === DreamObjectElmsValues.VeryLow ? 0 : Math.floor(DreamMaxElmsCount / 8);

  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;

  private size: number = 0.06;
  private noize: number = 0.12;
  private noizeRotate: number = 90 * this.noize;
  private countStep: [number, number] = [2, 4];
  private itemRotateRange: [number, number] = [-10, 10];
  private scaleRange: [number, number] = [1, 1.6];
  private rotationRadiusRange: [number, number] = [60, 20];
  private side: Side = DoubleSide;

  private color: Color = new Color(0.2, 0.8, 0.1);
  private maxHeight: number = this.heightPart * DreamMaxHeight;

  private params: Params;





  // Получение объекта
  getObject(): MapObject {
    const {
      countItterator,
      dummy,
      material,
      geometry,
      cX,
      cY,
    }: Params = this.getParams;
    let lX: number;
    let lY: number;
    let i: number = -1;
    let countStep: number;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = countItterator.map(() => {
      if ((IsMultiple(i, countStep) && i !== 0) || i === -1) {
        lX = Random(0, DreamCeilSize, true, 5);
        lY = Random(0, DreamCeilSize, true, 5);
        countStep = Random(this.countStep[0], this.countStep[1], false, 0);
        i = 0;
      }
      // Итератор
      i++;
      // Точная координата
      const x: number = cX + lX;
      const y: number = cY + lY;
      const stepAngle: number = 360 / countStep;
      // Проверка вписания в фигуру
      if (CheckCeilForm(cX, cY, x, y, this.neighboringCeils, this.ceil)) {
        const scale: number = Random(this.scaleRange[0], this.scaleRange[1], false, 5);
        // Настройки
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(x, this.getHeight(x, y), y);
        dummy.rotateY(AngleToRad((stepAngle * i) + Random(this.itemRotateRange[0], this.itemRotateRange[1])));
        dummy.rotateX(AngleToRad(Random(this.rotationRadiusRange[0], this.rotationRadiusRange[1]) + this.noizeRotate));
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        // Вернуть геометрию
        return new Matrix4().copy(dummy.matrix);
      }
      // Не отрисовывать геометрию
      return null;
    }).filter(matrix => !!matrix);
    // Вернуть объект
    return {
      type: "grass",
      subType: DreamMapPlantainGrassObject.getSubType(this.ceil, this.neighboringCeils),
      count: this.count,
      matrix,
      color: [],
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: false,
      recieveShadow: true
    };
  }

  // Определение параметров
  private get getParams(): Params {
    if (!!this.params) {
      this.params.cX = this.params.widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      this.params.cY = this.params.heightCorrect + (this.ceil.coord.y * DreamCeilSize);
    }
    // Определить параметры
    else {
      const objSize: number = this.size * this.widthPart;
      const geometryRadius: number = objSize;
      const geometryQuality: number = 4;
      // Данные фигуры
      const geometry: CircleGeometry = new CircleGeometry(geometryRadius, geometryQuality);
      const material: MeshPhongMaterial = new MeshPhongMaterial({
        color: this.color,
        fog: true,
        transparent: false,
        side: this.side,
        flatShading: true
      });
      const dummy: Object3D = new Object3D();
      // Параметры
      const terrainGeometry: PlaneGeometry = this.terrain.geometry as PlaneGeometry;
      const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
      const qualityHelper: number = quality - 1;
      const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
      const vertexItterator: number[] = CreateArray(quality);
      const facesCount: number = Math.pow(quality - 1, 2) * 2;
      const facesCountI: number[] = CreateArray(facesCount);
      const vertexes: Float32BufferAttribute = terrainGeometry.getAttribute("position") as Float32BufferAttribute;
      const wdth: number = terrainGeometry.parameters.widthSegments + 1;
      // Параметры карты
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const widthCorrect: number = -(oWidth * DreamCeilSize) / 2;
      const heightCorrect: number = -(oHeight * DreamCeilSize) / 2;
      const borderOSize: number = (terrainGeometry.parameters.width - oWidth) / 2;
      // Координаты
      const cX: number = widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      const cY: number = heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      // Свойства для оптимизации
      const triangle: Triangle = new Triangle();
      const facesTriangle: Triangle[] = facesCountI.map(() => new Triangle());
      const vertexVector3: Vector3[] = vertexItterator.map(() => vertexItterator.map(() => 0)).reduce((o, v) => ([...o, ...v]), []).map(() => new Vector3());
      const v1: Vector3 = new Vector3();
      const v2: Vector3 = new Vector3();
      const dir = new Vector3();
      const ray: Ray = new Ray();
      const intersect: Vector3 = new Vector3();
      const countItterator: number[] = CreateArray(this.count);
      // Настройки геометрии
      // geometry.rotateZ(AngleToRad((360 / -geometryQuality) / 4));
      geometry.applyMatrix4(new Matrix4().makeTranslation(0, geometryRadius, 0));
      geometry.scale(0.5, 1, 0);
      // Запомнить параметры
      this.params = {
        countItterator,
        objSize,
        material,
        geometry,
        dummy,
        terrainGeometry,
        quality,
        qualityHelper,
        hyp,
        vertexItterator,
        facesCount,
        facesCountI,
        vertexes,
        wdth,
        oWidth,
        oHeight,
        widthCorrect,
        heightCorrect,
        borderOSize,
        cX,
        cY,
        triangle,
        facesTriangle,
        vertexVector3,
        v1,
        v2,
        dir,
        ray,
        intersect,
        vertex: [],
        faces: []
      };
      // Создание шейдера
      this.createShader();
    }
    // Вершины
    this.params.vertex = this.params.vertexItterator.map(h => this.params.borderOSize + (this.params.cY - this.params.widthCorrect) + h)
      .map(h => this.params.vertexItterator.map(w => this.params.borderOSize + (this.params.cX - this.params.widthCorrect) + w).map(w => (h * this.params.wdth) + w))
      .reduce((o, v) => ([...o, ...v]), [])
      .map((i, k) => this.params.vertexVector3[k].set(this.params.vertexes.getX(i), -this.params.vertexes.getY(i), this.params.vertexes.getZ(i)))
      .sort((a, b) => {
        const rA: number = a.y * this.params.quality + a.x;
        const rB: number = b.y * this.params.quality + b.x;
        return rA > rB ? 1 : rA < rB ? -1 : 0
      });
    let vertexStart: number = 0;
    this.params.faces = this.params.facesCountI.map(i => {
      const isOdd: boolean = IsEven(i);
      const isEnd: boolean = IsMultiple(i + 1, this.params.quality) && i > 0;
      const a: number = vertexStart;
      const b: number = isOdd ? vertexStart + 1 : vertexStart + this.params.qualityHelper;
      const c: number = vertexStart + this.params.qualityHelper + 1;
      // Увеличить инкримент
      vertexStart = isOdd || isEnd ? vertexStart + 1 : vertexStart;
      // Вернуть сторону
      return this.params.facesTriangle[i].set(this.params.vertex[a], this.params.vertex[b], this.params.vertex[c]);
    });
    // Вернуть данные
    return this.params;
  }

  // Получить высоту объекта
  private getHeight(x: number, y: number): number {
    const {
      qualityHelper,
      hyp,
      v1,
      v2,
      dir,
      ray,
      intersect,
      triangle,
      faces,
      cX,
      cY
    }: Params = this.getParams;
    const lX: number = x - cX;
    const lY: number = y - cY;
    const xSeg: number = Math.floor(lX * qualityHelper);
    const ySeg: number = Math.floor(lY * qualityHelper);
    const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
    const seg: number = locHyp >= hyp ? 1 : 0;
    const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
    // Поиск координаты Z
    v1.set(x, y, 0);
    v2.set(x, y, this.maxHeight);
    dir.subVectors(v2, v1).normalize();
    dir.normalize();
    ray.set(v1, dir);
    ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
    triangle.set(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c);
    // Координата Z
    return intersect.z;
  }





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights
  ) {
    super(
      dreamMap,
      ceil,
      terrain,
      clock,
      alphaFogService,
      displacementTexture,
      neighboringCeils
    );
  }

  // Обновить сведения уже существующего сервиса
  updateDatas(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights
  ): DreamMapPlantainGrassObject {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementTexture = displacementTexture;
    this.neighboringCeils = neighboringCeils;
    // Вернуть экземаляр
    return this;
  }

  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    if (objectSetting.count > 0) {
      const matrix: Matrix4 = new Matrix4();
      const position: Vector3 = new Vector3();
      // Цикл по фрагментам
      objectSetting.indexKeys.forEach(index => {
        objectSetting.mesh.getMatrixAt(index, matrix);
        position.setFromMatrixPosition(matrix);
        // Координаты
        const x: number = position.x;
        const y: number = position.z;
        // Если координаты не нулевые
        if (x !== 0 && y !== 0) {
          const z: number = this.getHeight(x, y);
          // Запомнить позицию
          matrix.setPosition(x, z, y);
          objectSetting.mesh.setMatrixAt(index, matrix);
        }
      });
      // Обновить
      objectSetting.mesh.updateMatrix();
      objectSetting.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // Очистка памяти
  destroy(): void {
    this.params.dummy.remove();
    delete this.params;
  }





  // Анимация
  animate(): void {
    if (!!this.params?.shader?.uniforms?.time) {
      this.params.shader.uniforms.time.value = this.clock.getElapsedTime();
    }
  }

  // Создание шейдера движения
  private createShader(): void {
    if (!this.params.shader) {
      this.params.material.onBeforeCompile = shader => {
        NoizeShader(this.params.material, shader, this.noize);
        this.params.shader = shader;
      };
    }
  }
}





// Интерфейс параметров для расчетов
interface Params {
  countItterator: number[];
  objSize: number;
  geometry: CircleGeometry;
  material: MeshPhongMaterial;
  dummy: Object3D;
  terrainGeometry: PlaneGeometry;
  quality: number;
  qualityHelper: number;
  hyp: number;
  vertexItterator: number[];
  facesCount: number;
  facesCountI: number[];
  vertexes: Float32BufferAttribute;
  wdth: number;
  oWidth: number;
  oHeight: number;
  widthCorrect: number;
  heightCorrect: number;
  borderOSize: number;
  cX: number;
  cY: number;
  triangle: Triangle;
  facesTriangle: Triangle[];
  vertexVector3: Vector3[];
  faces: Triangle[];
  vertex: Vector3[];
  v1: Vector3;
  v2: Vector3;
  dir: Vector3;
  ray: Ray;
  intersect: Vector3;
  shader?: Shader;
}
