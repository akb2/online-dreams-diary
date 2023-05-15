import { CreateArray } from "@_datas/app";
import { DreamCeilSize, DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { AngleToRad, Cos, IsMultiple, LineFunc, MathRound, Random, Sin } from "@_helpers/math";
import { CustomObjectKey } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { AddMaterialBeforeCompile } from "@_threejs/base";
import { TreeGeometry, TreeGeometryParams } from "@_threejs/tree.geometry";
import { BufferGeometry, Color, DoubleSide, Euler, FrontSide, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, Shader, TangentSpaceNormalMap, Texture, Vector2, Vector3 } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetNormalizeVector, GetRandomColorByRange, GetRotateFromNormal, GetTextures, RotateCoordsByY, UpdateHeight } from "../_functions";
import { ColorRange, CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject } from "../_models";
import { DreamTreeElmsCount, HeightPart, TreeCounts, WidthPart } from "./_models";





export class DreamMapBirchTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree-birch";

  private treeCount: number = 0;
  private leafCount: number = 0;
  private posRange: number = 0.2;
  private noize: number = 0.15;
  private width: number = 0.03;
  private height: number = 90;

  private maxGeneration: number = 1;
  private radiusSegments: number = 3;
  private leafBranchCount: number = 2;
  private leafSkipSegments: number = 2;
  private segmentsCount: number = 5;

  private yAxis: Vector3 = new Vector3(0, 1, 0);
  private xAxis: Vector3 = new Vector3(1, 0, 0);
  private zAxis: Vector3 = new Vector3(0, 0, 1);

  private params: Params;





  // Получение объекта
  getObject(): MapObject[] {
    const { terrainGeometry, qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY }: Params = this.getParams;
    const params: GetHeightByTerrainObject = { terrainGeometry, qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY };
    const geometryIndex: number = Random(0, this.treeCount - 1, false, 0);
    const centerX: number = DreamCeilSize / 2;
    const scale: number = Random(0.8, 1, false, 3);
    const rotate: number = Random(0, 360, false, 0);
    const lX: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const lY: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const x: number = cX + lX;
    const y: number = cY + lY;
    // Координата Z
    const z: number = GetHeightByTerrain(params, x, y);
    // Вернуть массив объектов
    return [
      this.getBranchGeometry(lX, lY, scale, rotate, z, geometryIndex),
      this.getLeafParts(x, y, scale, rotate, z, geometryIndex)
    ];
  }

  // Вертикальные части
  private getBranchGeometry(lX: number, lY: number, scale: number, rotate: number, z: number, geometryIndex: number): MapObject {
    const { material: { tree: material }, geometry: { tree: geometries }, cX, cY, }: Params = this.getParams;
    const dummy: Object3D = new Object3D();
    const type: string = this.type + "-branch";
    const x: number = cX + lX;
    const y: number = cY + lY;
    const color: Color = GetRandomColorByRange(TreeColorRange);
    const geometry: TreeGeometry = geometries[geometryIndex];
    // Настройки
    dummy.matrix = DefaultMatrix.clone();
    dummy.position.set(x, z, y);
    dummy.scale.setScalar(scale);
    dummy.rotation.y = AngleToRad(rotate);
    dummy.updateMatrix();
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = [dummy.matrix.clone()];
    // Цвета
    const colors: Color[] = [color];
    // Вернуть объект
    return {
      type,
      subType: DreamMapBirchTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: true,
      count: 1,
      matrix: matrix,
      skews: [],
      color: colors,
      lodDistances: [],
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: true,
      recieveShadow: true,
      isDefault: false,
      raycastBox: true
    };
  }

  // Горизонтальные части
  private getLeafParts(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const { geometry: { tree: treeGeometries, leaf: geometry }, material: { leaf: material }, leafItterator }: Params = this.getParams;
    const type: string = this.type + "-leaf";
    const treeGeometry: TreeGeometry = treeGeometries[geometryIndex];
    const branchEnds: Vector3[] = treeGeometry.getPositionsOfBranches(this.leafSkipSegments < this.segmentsCount ? this.leafSkipSegments : 0);
    const maxY: number = branchEnds.reduce((o, { y }) => y > o ? y : o, 0);
    const minY: number = branchEnds.reduce((o, { y }) => y < o ? y : o, maxY);
    const color: Color = GetRandomColorByRange(LeafColorRange);
    const translates: CoordDto[] = [];
    let rotationCorr: Euler;
    let branchIndex: number = 0;
    let translate: CoordDto;
    let leafScale: number;
    let leafRotate: number;
    let isEven: boolean;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = leafItterator.map(k => {
      isEven = IsMultiple(k, this.leafBranchCount);
      branchIndex = isEven ? Random(0, branchEnds.length - 1) : branchIndex;
      const dummy: Object3D = new Object3D();
      const branchEnd: Vector3 = branchEnds[branchIndex].clone();
      // Новый фрагмент
      if (isEven) {
        const beforePoint: Vector3 = branchIndex > 0 ? branchEnds[branchIndex - 1].clone() : new Vector3(0, 0, 0);
        const branchNormals: Vector3 = GetNormalizeVector(branchEnd, beforePoint);
        const branchSizes: Vector3 = new Vector3((branchEnd.x - beforePoint.x) * scale, (branchEnd.y - beforePoint.y) * scale, (branchEnd.z - beforePoint.z) * scale);
        const shiftSize: number = Random(0, branchIndex > 0 ? 0.999999 : 0.2, false, 6);
        const leafZRotate: number = Random(0, 180);
        // Применение параметров
        translate = {
          x: MathRound((branchEnd.x * scale) - (branchSizes.x * shiftSize), 6),
          y: MathRound((branchEnd.y * scale) - (branchSizes.y * shiftSize), 6),
          z: MathRound((branchEnd.z * scale) - (branchSizes.z * shiftSize), 6)
        };
        // Параметры
        const branchUpRotate: number = LineFunc(0, 90, translate.y, minY, maxY) + AngleToRad(Random(-5, 15));
        // Применение параметров
        leafRotate = Random(0, 360);
        rotationCorr = GetRotateFromNormal(RotateCoordsByY(branchNormals, leafRotate), branchUpRotate, 0, leafZRotate);
        leafScale = LineFunc(0.0001, 1.5, translate.y, minY, maxY);
        leafScale += Random(-leafScale * 0.05, leafScale * 0.05, false, 5);
      }
      // Копировать старый
      else {
        rotationCorr.z += AngleToRad(180 / this.leafBranchCount);
      }
      // Преобразования
      dummy.position.set(bX, bZ, bY);
      dummy.rotateY(AngleToRad(rotate));
      dummy.translateX(translate.x);
      dummy.translateY(translate.y);
      dummy.translateZ(translate.z);
      dummy.rotateOnAxis(this.yAxis, AngleToRad(leafRotate));
      dummy.rotateOnAxis(this.xAxis, rotationCorr.x);
      dummy.rotateOnAxis(this.zAxis, rotationCorr.z);
      dummy.scale.setScalar(leafScale);
      dummy.updateMatrix();
      // Массив преобразований
      const saveTranslate: CoordDto = {
        x: (translate.x * Cos(-rotate)) - (translate.z * Sin(-rotate)),
        y: translate.y,
        z: (translate.x * Sin(-rotate)) + (translate.z * Cos(-rotate))
      };
      translates.push(saveTranslate);
      // Вернуть геометрию
      return dummy.matrix.clone();
    }).filter(matrix => !!matrix);
    // Вернуть объект
    return {
      type,
      subType: DreamMapBirchTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: false,
      count: this.leafCount,
      matrix: matrix,
      skews: [],
      lodDistances: [],
      color: matrix.map(() => color),
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: true,
      recieveShadow: true,
      isDefault: false,
      translates,
      raycastBox: true,
      noize: this.noize
    };
  }

  // Определение параметров
  private get getParams(): Params {
    const geometryDatas: CreateTerrainTrianglesObject = this.createTerrainTriangles();
    // Параметры
    this.treeCount = TreeCounts[this.dreamMapSettings.detalization];
    this.leafCount = LeafCounts[this.dreamMapSettings.detalization];
    this.leafBranchCount = LeafBranchCounts[this.dreamMapSettings.detalization];
    // Генерация параметров
    const treeGeometryParams: (objWidth: number, objHeight: number) => TreeGeometryParams = (objWidth: number, objHeight: number) => {
      const generations: number = Random(1, this.maxGeneration);
      const heightSegments: number = Math.round(this.segmentsCount / generations);
      const length: number = objHeight;
      // Вернуть геоиетрию
      return {
        generations,
        length,
        uvLength: generations * 4,
        radius: objWidth * Random(1, 2, false, 3),
        radiusSegments: this.radiusSegments,
        heightSegments
      };
    };
    // Параметры уже существуют
    if (!!this.params) {
      this.params.leafItterator = CreateArray(this.leafCount);
      this.params.geometry.tree = CreateArray(this.treeCount).map(i =>
        this.params.geometry.tree[i] ??
        new TreeGeometry(treeGeometryParams(this.params.objWidth, this.params.objHeight))
      );
      // Добавить параметры рельефа
      Object.entries(geometryDatas).forEach(([k, v]) => this.params[k] = v);
    }
    // Определить параметры
    else {
      const useTextureKeys: (keyof MeshStandardMaterial)[] = ["map", "aoMap", "lightMap", "normalMap"];
      // Параметры геометрии
      const objWidth: number = MathRound(this.width * WidthPart, 4);
      const objHeight: number = MathRound((this.height * DreamCeilSize) * HeightPart, 4);
      const leafWidth: number = objWidth * 7;
      const leafHeight: number = leafWidth * 2;
      const leafSize: number = 0;
      // Данные фигуры
      const treeGeometry: TreeGeometry[] = CreateArray(this.treeCount).map(() => new TreeGeometry(treeGeometryParams(objWidth, objHeight)));
      const leafGeometry: PlaneGeometry = new PlaneGeometry(leafWidth, leafHeight, 2, 2);
      const treeTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("birch-branch.jpg", "tree", useTextureKeys, texture => {
        const repeat: number = 1;
        // Настройки
        texture.repeat.set(repeat, MathRound(repeat * (this.height / this.segmentsCount)));
      });
      const leafTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("birch-leaf.png", "tree", useTextureKeys);
      const treeMaterial: MeshStandardMaterial = new MeshStandardMaterial({
        fog: true,
        side: FrontSide,
        ...treeTextures,
        aoMapIntensity: 0.9,
        lightMapIntensity: 0.6,
        transparent: true,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1)
      });
      const leafMaterial: MeshStandardMaterial = new MeshStandardMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.5,
        flatShading: true,
        ...leafTextures,
        aoMapIntensity: 0.01,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafSize
      });
      // Свойства для оптимизации
      const leafItterator: number[] = CreateArray(this.leafCount);
      // Настройки
      leafGeometry.setAttribute("uv2", leafGeometry.getAttribute("uv"));
      leafGeometry.translate(0, leafHeight / 2, 0);
      leafGeometry.rotateX(AngleToRad(90));
      leafGeometry.attributes.uv2.needsUpdate = true;
      // Запомнить параметры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        objWidth,
        objHeight,
        leafWidth,
        leafHeight,
        leafSize,
        geometry: {
          tree: treeGeometry,
          leaf: leafGeometry
        },
        material: {
          tree: treeMaterial,
          leaf: leafMaterial
        },
        texture: {
          tree: treeTextures,
          leaf: leafTextures
        },
        leafItterator
      };
      // Создание шейдера
      this.createShader();
    }
    // Настройки
    this.params.material.leaf.displacementScale = this.dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ? 0 : this.params.leafSize;
    // Вернуть данные
    return this.params;
  }





  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
    UpdateHeight(objectSetting, this.getParams);
  }

  // Очистка памяти
  destroy(): void {
    delete this.params;
  }





  // Анимация
  animate(): void {
    AnimateNoizeShader(this.params?.shader?.uniforms, this.clock);
  }

  // Создание шейдера
  private createShader(): void {
    if (!this.params.shader) {
      AddMaterialBeforeCompile(this.params.material.leaf, subShader => this.params.shader = subShader);
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  objWidth: number;
  objHeight: number;
  leafWidth: number;
  leafHeight: number;
  leafSize: number;
  geometry: {
    tree: TreeGeometry[],
    leaf: PlaneGeometry
  };
  material: {
    tree: MeshStandardMaterial,
    leaf: MeshStandardMaterial
  };
  texture: {
    tree: CustomObjectKey<keyof MeshStandardMaterial, Texture>;
    leaf: CustomObjectKey<keyof MeshStandardMaterial, Texture>;
  };
  leafItterator: number[];
  shader?: Shader;
}

// Диапазон цветов ствола
const TreeColorRange: ColorRange = [0.9, 1, 0.9, 1, 0.9, 1];

// Диапазон цветов листвы
const LeafColorRange: ColorRange = [0.8, 0.9, 0.9, 1, 0.8, 0.9];

// Список количества листвы на деревьях
export const LeafCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: Math.round(DreamTreeElmsCount * 2),
  [DreamObjectElmsValues.Low]: Math.round(DreamTreeElmsCount * 2),
  [DreamObjectElmsValues.Middle]: Math.round(DreamTreeElmsCount * 2),
  [DreamObjectElmsValues.High]: Math.round(DreamTreeElmsCount * 2.5),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamTreeElmsCount * 3),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamTreeElmsCount * 3.5),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamTreeElmsCount * 4)
};

// Список фрагментов в одной ветке
export const LeafBranchCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: 1,
  [DreamObjectElmsValues.Low]: 1,
  [DreamObjectElmsValues.Middle]: 1,
  [DreamObjectElmsValues.High]: 1,
  [DreamObjectElmsValues.VeryHigh]: 2,
  [DreamObjectElmsValues.Ultra]: 2,
  [DreamObjectElmsValues.Awesome]: 2
};
