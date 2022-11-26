import { AngleToRad, CreateArray, CustomObjectKey, IsEven, IsMultiple, MathRound, Random } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamBaseElmsCount, DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxHeight, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TreeGeometry, TreeGeometryParams } from "@_models/three.js/tree.geometry";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { BufferGeometry, CircleGeometry, Clock, Color, DataTexture, DoubleSide, Float32BufferAttribute, FrontSide, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Ray, Shader, Triangle, Vector3 } from "three";





export class DreamMapTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string, subType: string): string {
    return subType;
  }





  private type: string = "tree";
  private subType: string;
  private defaultMatrix: Matrix4 = new Matrix4();

  private treeCount: number = 0;
  private leafCount: number = 0;
  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private posRange: number = 0.2;
  private maxHeight: number = this.heightPart * DreamMaxHeight;
  private noize: number = 0.2;

  private width: number = 0.05;
  private height: number = 50;

  private params: Params;

  private colorRange: number[] = [0.3, 0.4, 0.2, 0.3, 0.1, 0.15];
  private leafColorRange: number[] = [0, 0.4, 0.7, 1, 0, 0.4];





  // Полный тип
  private get fullType(): string {
    return this.type + "-oak";
  }

  // Получение объекта
  getObject(): MapObject[] {
    const {
      cX,
      cY,
    }: Params = this.getParams;
    // Параметры
    const geometryIndex: number = Random(0, this.treeCount - 1, false, 0);
    const centerX: number = DreamCeilSize / 2;
    const scale: number = Random(0.7, 1, false, 3);
    const rotate: number = Random(0, 360, false, 0);
    const lX: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const lY: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const x: number = cX + lX;
    const y: number = cY + lY;
    // Координата Z
    const z: number = this.getHeight(x, y);
    // Вернуть массив объектов
    return [
      this.getBranchGeometry(lX, lY, scale, rotate, z, geometryIndex),
      this.getLeafParts(x, y, scale, rotate, z, geometryIndex)
    ];
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
    const treePos: Vector3 = new Vector3(bX, bZ, bY);
    let branchIndex: number = 0;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = leafItterator.map(() => {
      branchIndex = branchIndex + 1 < branchEnds.length ? branchIndex + 1 : 0;
      // Если найдена ветка
      if (!!branchEnds[branchIndex]) {
        const dummy: Object3D = new Object3D();
        const branchEnd: Vector3 = branchEnds[branchIndex];
        const x: number = bX + (branchEnd.x * scale);
        const y: number = bZ + (branchEnd.y * scale);
        const z: number = bY + (branchEnd.z * scale);
        // Точные координаты
        const leafPos: Vector3 = new Vector3(x, y, z);
        let moveDist: number = leafPos.distanceTo(treePos);
        let moveDir: Vector3 = new Vector3(treePos.x - leafPos.x, treePos.y - leafPos.y, treePos.z - leafPos.z);
        moveDir.normalize();
        // Преобразования
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.translateOnAxis(moveDir, moveDist);
        dummy.rotation.y = AngleToRad(rotate);
        moveDir.multiplyScalar(-1);
        dummy.translateOnAxis(moveDir, moveDist);
        dummy.rotation.set(Random(0, 180), Random(0, 180), Random(0, 180));
        dummy.updateMatrix();
        // Вернуть геометрию
        return dummy.matrix.clone();
      }
      // Ветка не найдена
      return null;
    }).filter(matrix => !!matrix);
    // Вернуть объект
    return {
      type,
      subType: DreamMapTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
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
      isDefault: false
    };
  }

  // Вертикальные части
  private getBranchGeometry(lX: number, lY: number, scale: number, rotate: number, z: number, geometryIndex: number): MapObject {
    const {
      material: { tree: material },
      geometry: { tree: geometries },
      cX,
      cY,
    }: Params = this.getParams;
    // Параметры
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
      subType: DreamMapTreeObject.getSubType(this.ceil, this.neighboringCeils, type, geometryIndex.toString()),
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
      heightSegments: 3
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
      const objWidth: number = MathRound(this.width * this.widthPart, 4);
      const objHeight: number = MathRound((this.height * DreamCeilSize) * this.heightPart, 4);
      const leafSize: number = objWidth * 5;
      // Данные фигуры
      const treeGeometry: TreeGeometry[] = CreateArray(this.treeCount).map(() => new TreeGeometry(treeGeometryParams(objWidth, objHeight)));
      const leafGeometry: CircleGeometry = new CircleGeometry(leafSize, 6);
      const treeMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({ fog: true, side: FrontSide })) as MeshStandardMaterial;
      const leafMaterial: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({ fog: true, side: DoubleSide })) as MeshStandardMaterial;
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
      cY,
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

  // Обновить сведения уже существующего сервиса
  updateDatas(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights,
    dreamMapSettings: DreamMapSettings
  ): DreamMapTreeObject {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementTexture = displacementTexture;
    this.neighboringCeils = neighboringCeils;
    this.dreamMapSettings = dreamMapSettings;
    // Вернуть экземпляр
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
    // if (!this.params.shader) {
    //   this.params.material.onBeforeCompile = shader => {
    //     NoizeShader(this.params.material, shader, this.noize, false);
    //     this.params.shader = shader;
    //   };
    // }
  }
}





// Интерфейс параметров для расчетов
interface Params {
  objWidth: number;
  objHeight: number;
  leafSize: number;
  geometry: {
    tree: TreeGeometry[],
    leaf: CircleGeometry
  };
  material: {
    tree: MeshStandardMaterial,
    leaf: MeshStandardMaterial
  };
  terrainGeometry: PlaneGeometry;
  oWidth: number;
  oHeight: number;
  widthCorrect: number;
  heightCorrect: number;
  borderOSize: number;
  cX: number;
  cY: number;
  leafItterator: number[];
  wdth: number;
  vertexItterator: number[];
  vertexes: Float32BufferAttribute;
  vertex: Vector3[];
  faces: Triangle[];
  vertexVector3: Vector3[];
  facesCount: number;
  facesCountItterator: number[];
  facesTriangle: Triangle[];
  v1: Vector3;
  v2: Vector3;
  dir: Vector3;
  ray: Ray;
  intersect: Vector3;
  quality: number;
  qualityHelper: number;
  hyp: number;
  shader?: Shader;
  triangle: Triangle;
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
  [DreamObjectElmsValues.Low]: Math.round(DreamBaseElmsCount * 1.1),
  [DreamObjectElmsValues.Middle]: Math.round(DreamBaseElmsCount * 1.2),
  [DreamObjectElmsValues.High]: Math.round(DreamBaseElmsCount * 1.3),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamBaseElmsCount * 1.4),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamBaseElmsCount * 1.5),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamBaseElmsCount * 1.6),
};
