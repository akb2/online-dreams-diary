import { CreateArray } from "@_datas/app";
import { DreamCeilSize, DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { AngleToRad, Cos, IsMultiple, LineFunc, MathRound, Random, Sin } from "@_helpers/math";
import { CustomObjectKey } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamTreeElmsCount, HeightPart, TreeCounts, WidthPart } from "@_services/dream-map/objects/tree/_models";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetNormalizeVector, GetRandomColorByRange, GetRotateFromNormal, GetTextures, RotateCoordsByY, UpdateHeight } from "@_services/dream-map/objects/_functions";
import { ColorRange, CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject } from "@_services/dream-map/objects/_models";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { TreeGeometry, TreeGeometryParams } from "@_threejs/tree.geometry";
import { BufferGeometry, Color, DoubleSide, Euler, FrontSide, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, Shader, TangentSpaceNormalMap, Texture, Vector2, Vector3 } from "three";





export class DreamMapFirTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree-fir";

  private treeCount: number = 0;
  private leafACount: number = 0;
  private leafBCount: number = 0;
  private posRange: number = 0.1;
  private noize: number = 0.15;
  private width: number = 0.04;
  private height: number = 110;

  private maxGeneration: number = 1;
  private radiusSegments: number = 3;
  private leafBranchCount: number = 2;
  private leafSkipSegments: number = 1;
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
      this.getLeafPartsA(x, y, scale, rotate, z, geometryIndex),
      this.getLeafPartsB(x, y, scale, rotate, z, geometryIndex)
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
      subType: DreamMapFirTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: true,
      count: 1,
      matrix: matrix,
      color: colors,
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this),
      castShadow: true,
      recieveShadow: true,
      isDefault: false
    };
  }

  // Горизонтальные части: ветки
  private getLeafPartsA(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const { geometry: { tree: treeGeometries, leafA: geometry }, material: { leafA: material }, leafAItterator: leafItterator }: Params = this.getParams;
    const type: string = this.type + "-leaf-a";
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
      subType: DreamMapFirTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: false,
      count: this.leafACount,
      matrix: matrix,
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
      translates
    };
  }

  // Горизонтальные части: по всей ширине
  private getLeafPartsB(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const { geometry: { tree: treeGeometries, leafB: geometry }, material: { leafB: material }, leafBItterator: leafItterator }: Params = this.getParams;
    const type: string = this.type + "-leaf-b";
    const treeGeometry: TreeGeometry = treeGeometries[geometryIndex];
    const branchEnds: Vector3[] = treeGeometry.getPositionsOfBranches(this.leafSkipSegments < this.segmentsCount ? this.leafSkipSegments : 0);
    const maxY: number = branchEnds.reduce((o, { y }) => y > o ? y : o, 0);
    const minY: number = branchEnds.reduce((o, { y }) => y < o ? y : o, maxY);
    const color: Color = GetRandomColorByRange(LeafColorRange);
    const translates: CoordDto[] = [];
    let rotationCorr: Euler;
    let translate: CoordDto;
    let leafScale: number;
    let leafRotate: number;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = leafItterator.map(() => {
      const branchIndex: number = Random(0, branchEnds.length - 1);
      const dummy: Object3D = new Object3D();
      const branchEnd: Vector3 = branchEnds[branchIndex].clone();
      const beforePoint: Vector3 = branchIndex > 0 ? branchEnds[branchIndex - 1].clone() : new Vector3(0, 0, 0);
      const branchNormals: Vector3 = GetNormalizeVector(branchEnd, beforePoint);
      const branchSizes: Vector3 = new Vector3((branchEnd.x - beforePoint.x) * scale, (branchEnd.y - beforePoint.y) * scale, (branchEnd.z - beforePoint.z) * scale);
      const shiftSize: number = Random(0, branchIndex > 0 ? 0.999999 : 0.2, false, 6);
      // Применение параметров
      translate = {
        x: MathRound((branchEnd.x * scale) - (branchSizes.x * shiftSize), 6),
        y: MathRound((branchEnd.y * scale) - (branchSizes.y * shiftSize), 6),
        z: MathRound((branchEnd.z * scale) - (branchSizes.z * shiftSize), 6)
      };
      // Применение параметров
      leafRotate = Random(0, 360);
      rotationCorr = GetRotateFromNormal(RotateCoordsByY(branchNormals, leafRotate));
      leafScale = LineFunc(0.0001, 1.6, translate.y, minY, maxY);
      leafScale += Random(-leafScale * 0.001, leafScale * 0.001, true, 5);
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
      subType: DreamMapFirTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: false,
      count: this.leafBCount,
      matrix: matrix,
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
      translates
    };
  }

  // Определение параметров
  private get getParams(): Params {
    const geometryDatas: CreateTerrainTrianglesObject = this.createTerrainTriangles();
    // Параметры
    this.treeCount = TreeCounts[this.dreamMapSettings.detalization];
    this.leafACount = LeafACounts[this.dreamMapSettings.detalization];
    this.leafBCount = LeafBCounts[this.dreamMapSettings.detalization];
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
      this.params.leafAItterator = CreateArray(this.leafACount);
      this.params.leafBItterator = CreateArray(this.leafBCount);
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
      const leafWidth: number = objWidth * 5;
      const leafHeight: number = leafWidth * 2;
      const leafDiameter: number = (leafHeight * 2) * 1.2;
      const leafASize: number = 0;
      const leafBSize: number = leafDiameter;
      // Данные фигуры
      const treeGeometry: TreeGeometry[] = CreateArray(this.treeCount).map(() => new TreeGeometry(treeGeometryParams(objWidth, objHeight)));
      const leafGeometryA: PlaneGeometry = new PlaneGeometry(leafWidth, leafHeight, 2, 2);
      const leafGeometryB: PlaneGeometry = new PlaneGeometry(leafDiameter, leafDiameter, 2, 2);
      const treeTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("fir-branch.jpg", "tree", useTextureKeys, texture => {
        const repeat: number = 1;
        // Настройки
        texture.repeat.set(repeat, MathRound(repeat * (this.height / this.segmentsCount)));
      });
      const leafATextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("fir-leaf-a.png", "tree", useTextureKeys);
      const leafBTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("fir-leaf-b.png", "tree", ["displacementMap", ...useTextureKeys]);
      const treeMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: FrontSide,
        ...treeTextures,
        aoMapIntensity: -0.5,
        lightMapIntensity: 0.5,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1)
      })) as MeshStandardMaterial;
      const leafAMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.5,
        flatShading: true,
        ...leafATextures,
        aoMapIntensity: -5,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafASize
      })) as MeshStandardMaterial;
      const leafBMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.5,
        flatShading: true,
        ...leafBTextures,
        aoMapIntensity: -2.3,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafBSize
      })) as MeshStandardMaterial;
      // Свойства для оптимизации
      const leafAItterator: number[] = CreateArray(this.leafACount);
      const leafBItterator: number[] = CreateArray(this.leafBCount);
      // Настройки
      leafGeometryA.setAttribute("uv2", leafGeometryB.getAttribute("uv"));
      leafGeometryA.translate(0, leafHeight / 2, 0);
      leafGeometryA.rotateX(AngleToRad(90));
      leafGeometryA.attributes.uv2.needsUpdate = true;
      leafGeometryB.setAttribute("uv2", leafGeometryB.getAttribute("uv"));
      // leafGeometryB.rotateX(AngleToRad(-90));
      leafGeometryB.attributes.uv2.needsUpdate = true;
      // Запомнить параметры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        objWidth,
        objHeight,
        leafWidth,
        leafHeight,
        leafASize,
        leafBSize,
        geometry: {
          tree: treeGeometry,
          leafA: leafGeometryA,
          leafB: leafGeometryB
        },
        material: {
          tree: treeMaterial,
          leafA: leafAMaterial,
          leafB: leafBMaterial
        },
        texture: {
          tree: treeTextures,
          leafA: leafATextures,
          leafB: leafBTextures
        },
        leafAItterator,
        leafBItterator
      };
      // Создание шейдера
      this.createShader();
    }
    // Настройки
    this.params.material.leafA.displacementScale = this.dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ? 0 : this.params.leafASize;
    // this.params.material.leafB.displacementScale = this.dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ? 0 : this.params.leafBSize;
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
    AnimateNoizeShader(this.params?.shaderA?.uniforms, this.clock);
    AnimateNoizeShader(this.params?.shaderB?.uniforms, this.clock);
  }

  // Создание шейдера
  private createShader(): void {
    if (!this.params.shaderA) {
      this.params.material.leafA.onBeforeCompile = subShader => {
        NoizeShader(this.params.material.leafA, subShader, this.noize, false);
        this.params.shaderA = subShader;
      };
    }
    // Второй шейдер
    if (!this.params.shaderB) {
      this.params.material.leafB.onBeforeCompile = subShader => {
        NoizeShader(this.params.material.leafB, subShader, this.noize, false);
        this.params.shaderB = subShader;
      };
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  objWidth: number;
  objHeight: number;
  leafWidth: number;
  leafHeight: number;
  leafASize: number;
  leafBSize: number;
  geometry: {
    tree: TreeGeometry[],
    leafA: PlaneGeometry,
    leafB: PlaneGeometry
  };
  material: {
    tree: MeshStandardMaterial,
    leafA: MeshStandardMaterial,
    leafB: MeshStandardMaterial
  };
  texture: {
    tree: CustomObjectKey<keyof MeshStandardMaterial, Texture>;
    leafA: CustomObjectKey<keyof MeshStandardMaterial, Texture>;
    leafB: CustomObjectKey<keyof MeshStandardMaterial, Texture>;
  };
  leafAItterator: number[];
  leafBItterator: number[];
  shaderA?: Shader;
  shaderB?: Shader;
}

// Диапазон цветов ствола
const TreeColorRange: ColorRange = [0.9, 1, 0.9, 1, 0.9, 1];

// Диапазон цветов листвы
const LeafColorRange: ColorRange = [0.8, 0.9, 0.9, 1, 0.8, 0.9];

// Список количества листвы на деревьях
export const LeafACounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: Math.round(DreamTreeElmsCount * 0.5),
  [DreamObjectElmsValues.Low]: Math.round(DreamTreeElmsCount * 0.6),
  [DreamObjectElmsValues.Middle]: Math.round(DreamTreeElmsCount * 0.7),
  [DreamObjectElmsValues.High]: Math.round(DreamTreeElmsCount * 0.8),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamTreeElmsCount * 0.9),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamTreeElmsCount * 1.0),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamTreeElmsCount * 1.1)
};

// Список количества листвы на деревьях
export const LeafBCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: Math.round(DreamTreeElmsCount * 0.5),
  [DreamObjectElmsValues.Low]: Math.round(DreamTreeElmsCount * 0.6),
  [DreamObjectElmsValues.Middle]: Math.round(DreamTreeElmsCount * 0.7),
  [DreamObjectElmsValues.High]: Math.round(DreamTreeElmsCount * 0.8),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamTreeElmsCount * 0.9),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamTreeElmsCount * 1.0),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamTreeElmsCount * 1.1)
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
