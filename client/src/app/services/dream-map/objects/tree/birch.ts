import { AngleToRad, Cos, CreateArray, CustomObjectKey, IsMultiple, LineFunc, MathRound, Random, Sin } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamCeilSize, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TreeGeometry, TreeGeometryParams } from "@_models/three.js/tree.geometry";
import { DreamTreeElmsCount, HeightPart, TreeCounts, WidthPart } from "@_services/dream-map/objects/tree/_models";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { AnimateNoizeShader, GetHeightByTerrain, GetRandomColorByRange, GetTextures, UpdateHeight } from "@_services/dream-map/objects/_functions";
import { ColorRange, CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject } from "@_services/dream-map/objects/_models";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { BufferGeometry, Color, DoubleSide, FrontSide, LinearFilter, LinearMipMapLinearFilter, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, RepeatWrapping, Shader, TangentSpaceNormalMap, Texture, Vector2, Vector3 } from "three";





export class DreamMapBirchTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree-birch";

  private treeCount: number = 0;
  private leafCount: number = 0;
  private posRange: number = 0.2;
  private noize: number = 0.25;
  private width: number = 0.06;
  private height: number = 57;
  private leafBranchCount: number = 2;

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

  // Горизонтальные части
  private getLeafParts(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const { geometry: { tree: treeGeometries, leaf: geometry }, material: { leaf: material }, leafItterator }: Params = this.getParams;
    const type: string = this.type + "-leaf";
    const treeGeometry: TreeGeometry = treeGeometries[geometryIndex];
    const branchEnds: Vector3[] = treeGeometry.getPositionsOfBranches(2);
    const maxY: number = branchEnds.reduce((o, { y }) => y > o ? y : o, 0);
    const minY: number = branchEnds.reduce((o, { y }) => y < o ? y : o, maxY);
    const color: Color = GetRandomColorByRange(LeafColorRange);
    const translates: CoordDto[] = [];
    let branchIndex: number = 0;
    let translate: CoordDto;
    let rotateY: number;
    let rotateX: number;
    let rotateZ: number;
    let leafScale: number;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = leafItterator.map(k => {
      const isEven: boolean = IsMultiple(k, this.leafBranchCount);
      branchIndex = isEven ? Random(0, branchEnds.length - 1) : branchIndex;
      const dummy: Object3D = new Object3D();
      const branchEnd: Vector3 = branchEnds[branchIndex].clone();
      const rotateZScale: number = AngleToRad(Random(-45, 45, false, 5));
      // Новый фрагмент
      if (isEven) {
        const translateY: number = branchEnd.y * scale;
        const branchNormals: Vector3 = new Vector3().copy(branchEnd);
        // Параметры
        branchNormals.normalize();
        translate = {
          x: MathRound(branchEnd.x * scale, 6),
          y: MathRound(translateY + Random(-translateY * 0.1, translateY * 0.1, false, 6), 6),
          z: MathRound(branchEnd.z * scale, 6)
        };
        rotateY = AngleToRad(Random(0, 360)) + Math.asin(branchNormals.y);
        rotateX = AngleToRad(LineFunc(-90, 0, translate.y, minY, maxY) + Random(-10, 10, false, 3)) + Math.asin(branchNormals.x);
        rotateZ = rotateZScale + Math.asin(branchNormals.z);
        leafScale = LineFunc(0.16, 1, translate.y, minY, maxY) + Random(0, 0.1);
      }
      // Копировать старый
      else {
        rotateZ += rotateZScale + AngleToRad(180 / this.leafBranchCount);
      }
      // Преобразования
      dummy.position.set(bX, bZ, bY);
      dummy.rotateY(AngleToRad(rotate));
      dummy.translateX(translate.x);
      dummy.translateY(translate.y);
      dummy.translateZ(translate.z);
      dummy.rotateY(rotateY);
      dummy.rotateX(rotateX);
      dummy.rotateZ(rotateZ);
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
    this.leafCount = LeafCounts[this.dreamMapSettings.detalization];
    // Генерация параметров
    const treeGeometryParams: (objWidth: number, objHeight: number) => TreeGeometryParams = (objWidth: number, objHeight: number) => {
      const generations: number = Random(1, 2);
      const heightSegments: number = 7 - generations;
      const length: number = objHeight;
      // Вернуть геоиетрию
      return {
        generations,
        length,
        uvLength: 16,
        radius: objWidth * Random(1, 2, false, 3),
        radiusSegments: 3,
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
        const repeat: number = 0.5;
        // Настройки
        texture.minFilter = LinearMipMapLinearFilter;
        texture.magFilter = LinearMipMapLinearFilter;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(repeat, repeat * (objHeight / objWidth * 2));
      });
      const leafTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = GetTextures("birch-leaf.png", "tree", [...useTextureKeys, "displacementMap"], texture => {
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
      });
      const treeMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: FrontSide,
        ...treeTextures,
        aoMapIntensity: 0.3,
        lightMapIntensity: 1,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1)
      })) as MeshStandardMaterial;
      const leafMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: DoubleSide,
        transparent: true,
        alphaTest: 0.5,
        flatShading: true,
        ...leafTextures,
        aoMapIntensity: 0.2,
        lightMapIntensity: 7,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafSize
      })) as MeshStandardMaterial;
      // Свойства для оптимизации
      const leafItterator: number[] = CreateArray(this.leafCount);
      // Настройки
      leafGeometry.setAttribute("uv2", leafGeometry.getAttribute("uv"));
      leafGeometry.translate(0, leafHeight / 2, 0);
      leafGeometry.rotateX(AngleToRad(90));
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
  [DreamObjectElmsValues.VeryLow]: DreamTreeElmsCount,
  [DreamObjectElmsValues.Low]: Math.round(DreamTreeElmsCount * 1.3),
  [DreamObjectElmsValues.Middle]: Math.round(DreamTreeElmsCount * 1.6),
  [DreamObjectElmsValues.High]: Math.round(DreamTreeElmsCount * 1.9),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamTreeElmsCount * 2.2),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamTreeElmsCount * 2.5),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamTreeElmsCount * 3)
};
