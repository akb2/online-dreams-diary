import { CreateArray } from "@_datas/app";
import { DreamCeilSize, DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { NoizeShader } from "@_datas/three.js/shaders/noise.shader";
import { AngleToRad, Cos, MathRound, Random, Sin } from "@_helpers/math";
import { ArrayForEach } from "@_helpers/objects";
import { CustomObjectKey } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { TreeGeometry, TreeGeometryParams } from "@_threejs/tree.geometry";
import { BufferGeometry, Color, DoubleSide, FrontSide, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, Shader, TangentSpaceNormalMap, Texture, Vector2, Vector3 } from "three";
import { DreamMapObjectTemplate } from "../_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetRandomColorByRange, GetTextures, UpdateHeight } from "../_functions";
import { ColorRange, CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject } from "../_models";
import { DreamTreeElmsCount, HeightPart, TreeCounts, WidthPart } from "./_models";





export class DreamMapOakTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree-oak";

  private treeCount: number = 0;
  private leafCount: number = DreamTreeElmsCount;
  private posRange: number = 0.2;
  private noize: number = 0.25;
  private width: number = 0.06;
  private height: number = 70;

  private maxGeneration: number = 3;
  private radiusSegments: number = 3;
  private segmentsCount: number = 7;

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
      subType: DreamMapOakTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: true,
      count: 1,
      matrix: matrix,
      skews: [],
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
      isDefault: false,
      raycastBox: true
    };
  }

  // Горизонтальные части
  private getLeafParts(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const { geometry: { tree: treeGeometries, leaf: geometry }, material: { leaf: material }, leafItterator }: Params = this.getParams;
    const type: string = this.type + "-leaf";
    const treeGeometry: TreeGeometry = treeGeometries[geometryIndex];
    const branchEnds: Vector3[] = treeGeometry.getEndsOfBranches;
    const color: Color = GetRandomColorByRange(LeafColorRange);
    let branchIndex: number = 0;
    // Цикл по количеству фрагментов
    const translates: CoordDto[] = [];
    const matrix: Matrix4[] = leafItterator.map(() => {
      branchIndex = Random(0, branchEnds.length - 1);
      // Если найдена ветка
      if (!!branchEnds[branchIndex]) {
        const dummy: Object3D = new Object3D();
        const branchEnd: Vector3 = branchEnds[branchIndex];
        const leafScale: number = Random(0.7, 1, false, 4);
        const translate: CoordDto = { x: branchEnd.x * scale, y: branchEnd.y * scale, z: branchEnd.z * scale };
        // Преобразования
        dummy.rotation.y = AngleToRad(rotate);
        dummy.position.set(bX, bZ, bY);
        dummy.translateX(translate.x);
        dummy.translateY(translate.y);
        dummy.translateZ(translate.z);
        dummy.rotation.set(Random(0, 180), Random(0, 180), Random(0, 180));
        dummy.scale.setScalar(leafScale);
        dummy.updateMatrix();
        // Массив преобразований
        translate.x = (translate.x * Cos(-rotate)) - (translate.z * Sin(-rotate), 5);
        translate.z = (translate.x * Sin(-rotate)) + (translate.z * Cos(-rotate), 5);
        translates.push(translate);
        // Обновленная геометрия
        const tempGeometry: BufferGeometry = geometry.clone();
        tempGeometry.applyMatrix4(dummy.matrix);
        // Вернуть геометрию
        return dummy.matrix.clone();
      }
      // Ветка не найдена
      return null;
    }).filter(matrix => !!matrix);
    // Вернуть объект
    return {
      type,
      subType: DreamMapOakTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
      splitBySubType: false,
      count: this.leafCount,
      matrix: matrix,
      skews: [],
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
      raycastBox: true
    };
  }

  // Определение параметров
  private get getParams(): Params {
    const geometryDatas: CreateTerrainTrianglesObject = this.createTerrainTriangles();
    // Параметры
    this.treeCount = TreeCounts[this.dreamMapSettings.detalization];
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
      ArrayForEach(Object.entries(geometryDatas), ([k, v]) => this.params[k] = v, true);
    }
    // Определить параметры
    else {
      const useTextureKeys: (keyof MeshStandardMaterial)[] = ["map", "aoMap", "lightMap", "normalMap"];
      // Параметры геометрии
      const objWidth: number = MathRound(this.width * WidthPart, 4);
      const objHeight: number = MathRound((this.height * DreamCeilSize) * HeightPart, 4);
      const leafSize: number = objWidth * 15;
      // Данные фигуры
      const treeGeometry: TreeGeometry[] = CreateArray(this.treeCount).map(() => new TreeGeometry(treeGeometryParams(objWidth, objHeight)));
      const leafGeometry: PlaneGeometry = new PlaneGeometry(leafSize, leafSize, 2, 2);
      const treeTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("oak-branch.jpg", "tree", useTextureKeys, texture => {
        const repeat: number = 2;
        // Настройки
        texture.repeat.set(repeat, MathRound(repeat * (this.height / this.segmentsCount)));
      });
      const leafTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("oak-leaf.png", "tree", [...useTextureKeys, "displacementMap"]);
      const treeMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: FrontSide,
        ...treeTextures,
        aoMapIntensity: 0.1,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1)
      })) as MeshStandardMaterial;
      const leafMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.7,
        flatShading: true,
        ...leafTextures,
        aoMapIntensity: 0.1,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafSize * 2
      })) as MeshStandardMaterial;
      // Свойства для оптимизации
      const leafItterator: number[] = CreateArray(this.leafCount);
      // Настройки
      leafGeometry.setAttribute("uv2", leafGeometry.getAttribute("uv"));
      leafGeometry.attributes.uv2.needsUpdate = true;
      // Запомнить параметры
      this.params = {
        ...geometryDatas,
        ...this.createParamsHelpers(),
        objWidth,
        objHeight,
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
    this.params.material.leaf.displacementScale = this.dreamMapSettings.detalization === DreamObjectElmsValues.VeryLow ? 0 : this.params.leafSize / 3;
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
      this.params.material.leaf.onBeforeCompile = subShader => {
        NoizeShader(this.params.material.leaf, subShader, this.noize, false);
        this.params.shader = subShader;
      };
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject, CreateTerrainTrianglesObject {
  objWidth: number;
  objHeight: number;
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
