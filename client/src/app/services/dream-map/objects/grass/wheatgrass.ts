import { AngleToRad, Cos, CreateArray, IsEven, IsMultiple, LineFunc, Random, Sin } from "@_models/app";
import { ClosestHeight, ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxElmsCount, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TriangleGeometry } from "@_models/three.js/triangle.geometry";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { CheckCeilForm, GetLikeNeighboringKeys } from "@_services/dream-map/objects/grass/_functions";
import { AllCorners, AnglesB, CeilGrassFillGeometry, ColorRange, GrassMaterial } from "@_services/dream-map/objects/grass/_models";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { GetHeightByTerrain, GetHeightByTerrainObject, UpdateHeight } from "@_services/dream-map/objects/_functions";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { BufferGeometry, Clock, Color, DataTexture, Float32BufferAttribute, Matrix4, Mesh, MeshPhongMaterial, Object3D, PlaneGeometry, Ray, Shader, Triangle, Vector3 } from "three";





export class DreamMapWheatGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights): string {
    const closestKeys: (keyof ClosestHeights)[] = GetLikeNeighboringKeys(ceil, neighboringCeils);
    const closestCeils: ClosestHeight[] = closestKeys.map(k => neighboringCeils[k]);
    const closestCount: number = closestCeils.length;
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





  private count: number = 0;

  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;

  private width: number = 0.022;
  private height: number = 6;
  private noize: number = 0.22;
  private countStep: [number, number] = [1, 1];
  private scaleY: number[] = [1, 3];
  private scaleX: number[] = [1.5, 1];
  private noizeRotate: number = 90 * (this.noize / 2);
  private rotationRadiusRange: number = 30;

  private params: Params;





  // Получение объекта
  getObject(): MapObject {
    if (this.count > 0) {
      const { qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY, countItterator, dummy, material, geometry }: Params = this.getParams;
      const params: GetHeightByTerrainObject = { qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY };
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
        // Проверка вписания в фигуру
        if (CheckCeilForm(cX, cY, x, y, this.neighboringCeils, this.ceil)) {
          const scaleY: number = Random(this.scaleY[0], this.scaleY[1], false, 5);
          const scaleX: number = LineFunc(this.scaleX[0], this.scaleX[1], scaleY, this.scaleY[0], this.scaleY[1]);
          const rotationRadius: number = Random(0, this.rotationRadiusRange, false, 5);
          const rotationAngle: number = Random(0, 360);
          // Настройки
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(x, GetHeightByTerrain(params, x, y), y);
          dummy.rotation.x = AngleToRad((rotationRadius * Sin(rotationAngle)) - this.noizeRotate);
          dummy.rotation.z = AngleToRad(rotationRadius * Cos(rotationAngle));
          dummy.rotation.y = AngleToRad(Random(0, 180, false, 1));
          dummy.scale.set(scaleX, scaleY, 0);
          dummy.updateMatrix();
          // Вернуть геометрию
          return new Matrix4().copy(dummy.matrix);
        }
        // Не отрисовывать геометрию
        return null;
      }).filter(matrix => !!matrix);
      // Вернуть объект
      return {
        type: "wheatgrass",
        subType: DreamMapWheatGrassObject.getSubType(this.ceil, this.neighboringCeils),
        splitBySubType: false,
        count: this.count,
        matrix,
        color: matrix.map(() => new Color(
          Random(ColorRange[0], ColorRange[1], false, 3),
          Random(ColorRange[2], ColorRange[3], false, 3),
          Random(ColorRange[4], ColorRange[5], false, 3)
        )),
        geometry: geometry as BufferGeometry,
        material,
        coords: {
          x: this.ceil.coord.x,
          y: this.ceil.coord.y
        },
        animate: this.animate.bind(this),
        castShadow: false,
        recieveShadow: true,
        isDefault: false
      };
    }
    // Пустой объект
    return null;
  }

  // Определение параметров
  private get getParams(): Params {
    if (!!this.params) {
      this.params.cX = this.params.widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      this.params.cY = this.params.heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      this.params.countItterator = CreateArray(this.count);
    }
    // Определить параметры
    else {
      const objWidth: number = this.width * this.widthPart;
      const objHeight: number = this.height * this.heightPart;
      const hyp2: number = objWidth / 2;
      const leg: number = Math.sqrt(Math.pow(hyp2, 2) + Math.pow(objHeight, 2));
      // Данные фигуры
      const geometry: TriangleGeometry = new TriangleGeometry(leg, objWidth, leg);
      const material: MeshPhongMaterial = GrassMaterial;
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
      // Запомнить параметры
      this.params = {
        countItterator,
        objWidth,
        objHeight,
        hyp2,
        material,
        leg,
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





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ) {
    super(
      dreamMap,
      ceil,
      terrain,
      clock,
      alphaFogService,
      displacementTexture,
      neighboringCeils,
      dreamMapSettings
    );
    // Обновить
    this.count = dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ? 0 : DreamMaxElmsCount(dreamMapSettings.detalization);
  }

  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    UpdateHeight(objectSetting, this.getParams);
  }

  // Очистка памяти
  destroy(): void {
    this.params?.dummy?.remove();
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
interface Params extends GetHeightByTerrainObject {
  countItterator: number[];
  objWidth: number;
  objHeight: number;
  hyp2: number;
  leg: number;
  geometry: TriangleGeometry;
  material: MeshPhongMaterial;
  dummy: Object3D;
  terrainGeometry: PlaneGeometry;
  quality: number;
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
  facesTriangle: Triangle[];
  vertexVector3: Vector3[];
  vertex: Vector3[];
  shader?: Shader;
}
