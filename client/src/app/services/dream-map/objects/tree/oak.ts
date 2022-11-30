import { AngleToRad, Cos, CreateArray, CustomObjectKey, MathRound, Random, Sin } from "@_models/app";
import { CoordDto } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamBaseElmsCount, DreamCeilParts, DreamCeilSize, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TreeGeometry, TreeGeometryParams } from "@_models/three.js/tree.geometry";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { AnimateNoizeShader, CreateNoizeShader, GetHeightByTerrain, GetRandomColorByRange, UpdateHeight } from "@_services/dream-map/objects/_functions";
import { ColorRange, CreateTerrainTrianglesObject, DefaultMatrix, GetHeightByTerrainObject, TextureKeys } from "@_services/dream-map/objects/_models";
import { BufferGeometry, Color, DoubleSide, FrontSide, LinearMipMapNearestFilter, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, RepeatWrapping, Shader, sRGBEncoding, TangentSpaceNormalMap, Texture, TextureLoader, Vector2, Vector3 } from "three";





export class DreamMapOakTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree-oak";
  private textureKeys: [keyof MeshStandardMaterial, string][] = TextureKeys;

  private treeCount: number = 0;
  private leafCount: number = 0;
  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private posRange: number = 0.2;
  private noize: number = 0.25;

  private width: number = 0.06;
  private height: number = 60;

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
      color: colors,
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
      const generations: number = Random(1, 3);
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
      const textureLoader: TextureLoader = new TextureLoader();
      const textureData: (texture: Texture) => void = (texture: Texture) => {
        texture.encoding = sRGBEncoding;
        texture.minFilter = LinearMipMapNearestFilter;
        texture.magFilter = LinearMipMapNearestFilter;
      }
      // Параметры геометрии
      const objWidth: number = MathRound(this.width * this.widthPart, 4);
      const objHeight: number = MathRound((this.height * DreamCeilSize) * this.heightPart, 4);
      const leafSize: number = objWidth * 14;
      // Данные фигуры
      const treeGeometry: TreeGeometry[] = CreateArray(this.treeCount).map(() => new TreeGeometry(treeGeometryParams(objWidth, objHeight)));
      const leafGeometry: PlaneGeometry = new PlaneGeometry(leafSize, leafSize, 2, 2);
      const treeTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = this.textureKeys
        .map(([key, path]) => ([key, textureLoader.load("/assets/dream-map/object/tree/" + path + "/1-0.jpg", texture => {
          const repeat: number = 1;
          // Настройки
          textureData(texture);
          texture.wrapS = RepeatWrapping;
          texture.wrapT = RepeatWrapping;
          texture.repeat.set(repeat, repeat * (objHeight / objWidth * 2));
        })]))
        .reduce((o, [key, texture]) => ({ ...o, [key as keyof MeshStandardMaterial]: texture as Texture }), {});
      const leafTextures: CustomObjectKey<keyof MeshStandardMaterial, Texture> = this.textureKeys
        .map(([key, path]) => ([key, textureLoader.load("/assets/dream-map/object/tree/" + path + "/1-1.png", textureData)]))
        .reduce((o, [key, texture]) => ({ ...o, [key as keyof MeshStandardMaterial]: texture as Texture }), {});
      const treeMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        fog: true,
        side: FrontSide,
        ...treeTextures,
        aoMapIntensity: 0.5,
        lightMapIntensity: 10,
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
        aoMapIntensity: -0.5,
        lightMapIntensity: 10,
        roughness: 0.8,
        normalMapType: TangentSpaceNormalMap,
        normalScale: new Vector2(1, 1),
        displacementScale: leafSize * 2
      })) as MeshStandardMaterial;
      // Свойства для оптимизации
      const leafItterator: number[] = CreateArray(this.leafCount);
      // Настройки
      leafGeometry.setAttribute("uv2", leafGeometry.getAttribute("uv"));
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
      CreateNoizeShader(this.params.shader, this.params.material.leaf, this.noize, false, shader => this.params.shader = shader);
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

// Список количества геометрий дерева
const TreeCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: 1,
  [DreamObjectElmsValues.Low]: 2,
  [DreamObjectElmsValues.Middle]: 3,
  [DreamObjectElmsValues.High]: 4,
  [DreamObjectElmsValues.VeryHigh]: 5,
  [DreamObjectElmsValues.Ultra]: 6,
  [DreamObjectElmsValues.Awesome]: 7,
};

// Список количества листвы на деревьях
const LeafCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: DreamBaseElmsCount,
  [DreamObjectElmsValues.Low]: DreamBaseElmsCount,
  [DreamObjectElmsValues.Middle]: Math.round(DreamBaseElmsCount * 1.1),
  [DreamObjectElmsValues.High]: Math.round(DreamBaseElmsCount * 1.2),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamBaseElmsCount * 1.3),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamBaseElmsCount * 1.4),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamBaseElmsCount * 1.5)
};

// Диапазон цветов ствола
const TreeColorRange: ColorRange = [0.9, 1, 0.9, 1, 0.9, 1];

// Диапазон цветов листвы
const LeafColorRange: ColorRange = [0.8, 0.9, 0.9, 1, 0.8, 0.9];
