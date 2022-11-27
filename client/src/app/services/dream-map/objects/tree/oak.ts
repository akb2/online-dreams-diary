import { AngleToRad, CreateArray, CustomObjectKey, IsEven, IsMultiple, MathRound, Random } from "@_models/app";
import { ClosestHeights, CoordDto, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamBaseElmsCount, DreamCeilParts, DreamCeilSize, DreamMapSize, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TreeGeometry, TreeGeometryParams } from "@_models/three.js/tree.geometry";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { GetHeightByTerrain, GetHeightByTerrainObject, UpdateHeight } from "@_services/dream-map/objects/_functions";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { BufferGeometry, Clock, Color, DataTexture, DoubleSide, Float32BufferAttribute, FrontSide, LinearMipMapNearestFilter, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Ray, RepeatWrapping, Shader, sRGBEncoding, TangentSpaceNormalMap, Texture, TextureLoader, Triangle, Vector2, Vector3 } from "three";





export class DreamMapOakTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string, subType: string): string {
    return subType;
  }





  private type: string = "tree";
  private defaultMatrix: Matrix4 = new Matrix4();
  private textureKeys: [keyof MeshStandardMaterial, string][] = [
    ["map", "face"],
    ["aoMap", "ao"],
    ["lightMap", "light"],
    ["normalMap", "normal"],
    ["displacementMap", "displacement"]
  ];

  private treeCount: number = 0;
  private leafCount: number = 0;
  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private posRange: number = 0.2;
  private noize: number = 0.25;

  private width: number = 0.04;
  private height: number = 48;

  private params: Params;

  private colorRange: number[] = [0.9, 1, 0.9, 1, 0.9, 1];
  private leafColorRange: number[] = [0.8, 0.9, 0.9, 1, 0.8, 0.9];





  // Полный тип
  private get fullType(): string {
    return this.type + "-oak";
  }

  // Получение объекта
  getObject(): MapObject[] {
    const { qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY }: Params = this.getParams;
    const params: GetHeightByTerrainObject = { qualityHelper, hyp, v1, v2, dir, ray, intersect, triangle, faces, cX, cY };
    const geometryIndex: number = Random(0, this.treeCount - 1, false, 0);
    const centerX: number = DreamCeilSize / 2;
    const scale: number = Random(0.5, 1, false, 3);
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
    const type: string = this.fullType + "-branch";
    const x: number = cX + lX;
    const y: number = cY + lY;
    const color: Color = new Color(
      Random(this.colorRange[0], this.colorRange[1], false, 3),
      Random(this.colorRange[2], this.colorRange[3], false, 3),
      Random(this.colorRange[4], this.colorRange[5], false, 3)
    );
    const geometry: TreeGeometry = geometries[geometryIndex];
    // Настройки
    dummy.matrix = this.defaultMatrix.clone();
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
      recieveShadow: false,
      isDefault: false
    };
  }

  // Горизонтальные части
  private getLeafParts(bX: number, bY: number, scale: number, rotate: number, bZ: number, geometryIndex: number): MapObject {
    const {
      geometry: { tree: treeGeometries, leaf: geometry },
      material: { leaf: material },
      leafItterator
    }: Params = this.getParams;
    // Параметры
    const type: string = this.fullType + "-leaf";
    const treeGeometry: TreeGeometry = treeGeometries[geometryIndex];
    const branchEnds: Vector3[] = treeGeometry.getEndsOfBranches;
    const color: Color = new Color(
      Random(this.leafColorRange[0], this.leafColorRange[1], false, 3),
      Random(this.leafColorRange[2], this.leafColorRange[3], false, 3),
      Random(this.leafColorRange[4], this.leafColorRange[5], false, 3)
    );
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
        // Преобразования
        dummy.position.set(bX, bZ, bY);
        dummy.rotation.y = AngleToRad(rotate);
        dummy.translateX(branchEnd.x * scale);
        dummy.translateY(branchEnd.y * scale);
        dummy.translateZ(branchEnd.z * scale);
        dummy.rotation.set(Random(0, 180), Random(0, 180), Random(0, 180));
        dummy.scale.setScalar(leafScale);
        dummy.updateMatrix();
        // Массив преобразований
        translates.push({ x: branchEnd.x * scale, y: branchEnd.y * scale, z: branchEnd.z * scale });
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
    this.treeCount = TreeCounts[this.dreamMapSettings.detalization];
    this.leafCount = LeafCounts[this.dreamMapSettings.detalization];
    // Генерация параметров
    const treeGeometryParams: (objWidth: number, objHeight: number) => TreeGeometryParams = (objWidth: number, objHeight: number) => ({
      generations: 4,
      length: objHeight,
      uvLength: 16,
      radius: objWidth * Random(1, 2, false, 3),
      radiusSegments: 3,
      heightSegments: 2
    });
    // Параметры уже существуют
    if (!!this.params) {
      this.params.cX = this.params.widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      this.params.cY = this.params.heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      this.params.leafItterator = CreateArray(this.leafCount);
      this.params.geometry.tree = CreateArray(this.treeCount).map(i =>
        this.params.geometry.tree[i] ??
        new TreeGeometry(treeGeometryParams(this.params.objWidth, this.params.objHeight))
      );
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
      const leafSize: number = objWidth * 16;
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
        displacementScale: leafSize / 4
      })) as MeshStandardMaterial;
      // Параметры
      const terrainGeometry: PlaneGeometry = this.terrain.geometry as PlaneGeometry;
      const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
      const qualityHelper: number = quality - 1;
      const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
      const vertexItterator: number[] = CreateArray(quality);
      const facesCount: number = Math.pow(quality - 1, 2) * 2;
      const facesCountItterator: number[] = CreateArray(facesCount);
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
      const facesTriangle: Triangle[] = facesCountItterator.map(() => new Triangle());
      const vertexVector3: Vector3[] = vertexItterator.map(() => vertexItterator.map(() => 0)).reduce((o, v) => ([...o, ...v]), []).map(() => new Vector3());
      const v1: Vector3 = new Vector3();
      const v2: Vector3 = new Vector3();
      const dir = new Vector3();
      const ray: Ray = new Ray();
      const intersect: Vector3 = new Vector3();
      const leafItterator: number[] = CreateArray(this.leafCount);
      // Настройки
      leafGeometry.setAttribute("uv2", leafGeometry.getAttribute("uv"));
      // Запомнить параметры
      this.params = {
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
        terrainGeometry,
        oWidth,
        oHeight,
        widthCorrect,
        heightCorrect,
        borderOSize,
        cX,
        cY,
        leafItterator,
        wdth,
        vertexes,
        vertexItterator,
        vertexVector3,
        facesCount,
        facesCountItterator,
        facesTriangle,
        v1,
        v2,
        dir,
        ray,
        intersect,
        quality,
        qualityHelper,
        hyp,
        vertex: [],
        faces: [],
        triangle
      };
      // Создание шейдера
      this.createShader();
    }
    // Вершины текущей ячейки
    this.params.vertex = this.params.vertexItterator.map(h => this.params.borderOSize + (this.params.cY - this.params.widthCorrect) + h)
      .map(h => this.params.vertexItterator
        .map(w => this.params.borderOSize + (this.params.cX - this.params.widthCorrect) + w)
        .map(w => (h * this.params.wdth) + w)
      )
      .reduce((o, v) => ([...o, ...v]), [])
      .map((i, k) => this.params.vertexVector3[k]
        .set(this.params.vertexes.getX(i), -this.params.vertexes.getY(i), this.params.vertexes.getZ(i))
      )
      .sort((a, b) => {
        const rA: number = a.y * this.params.quality + a.x;
        const rB: number = b.y * this.params.quality + b.x;
        return rA > rB ? 1 : rA < rB ? -1 : 0
      });
    // Стороны текущей ячейки
    let vertexStart: number = 0;
    this.params.faces = this.params.facesCountItterator.map(i => {
      const isOdd: boolean = IsEven(i);
      const isEnd: boolean = IsMultiple(i + 1, this.params.quality) && i > 0;
      const a: number = vertexStart;
      const b: number = isOdd ? vertexStart + 1 : vertexStart + this.params.qualityHelper;
      const c: number = vertexStart + this.params.qualityHelper + 1;
      // Увеличить инкримент
      vertexStart = isOdd || isEnd ? vertexStart + 1 : vertexStart;
      // Вернуть сторону
      return this.params.facesTriangle[i].set(
        this.params.vertex[a],
        this.params.vertex[b],
        this.params.vertex[c]
      );
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
    displacementCanvas: DataTexture,
    neighboringCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ) {
    super(
      dreamMap,
      ceil,
      terrain,
      clock,
      alphaFogService,
      displacementCanvas,
      neighboringCeils,
      dreamMapSettings,
    );
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
    if (!!this.params?.shader?.uniforms?.time) {
      this.params.shader.uniforms.time.value = this.clock.getElapsedTime();
    }
  }

  // Создание шейдера движения
  private createShader(): void {
    if (!this.params.shader) {
      this.params.material.leaf.onBeforeCompile = shader => {
        NoizeShader(this.params.material.leaf, shader, this.noize, false);
        this.params.shader = shader;
      };
    }
  }
}





// Интерфейс параметров для расчетов
interface Params extends GetHeightByTerrainObject {
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
  terrainGeometry: PlaneGeometry;
  oWidth: number;
  oHeight: number;
  widthCorrect: number;
  heightCorrect: number;
  borderOSize: number;
  leafItterator: number[];
  wdth: number;
  vertexItterator: number[];
  vertexes: Float32BufferAttribute;
  vertex: Vector3[];
  vertexVector3: Vector3[];
  facesCount: number;
  facesCountItterator: number[];
  facesTriangle: Triangle[];
  quality: number;
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
  [DreamObjectElmsValues.Awesome]: 10,
};

// Список количества листвы на деревьях
const LeafCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: DreamBaseElmsCount,
  [DreamObjectElmsValues.Low]: Math.round(DreamBaseElmsCount * 1.2),
  [DreamObjectElmsValues.Middle]: Math.round(DreamBaseElmsCount * 1.4),
  [DreamObjectElmsValues.High]: Math.round(DreamBaseElmsCount * 1.6),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamBaseElmsCount * 1.8),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamBaseElmsCount * 2),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamBaseElmsCount * 2.2),
};
