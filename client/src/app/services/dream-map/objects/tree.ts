import { AngleToRad, CreateArray, CustomObjectKey, IsEven, IsMultiple, Random } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings, ObjectTexturePaths } from "@_models/dream-map";
import { MapObject, ObjectSetting } from "@_models/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxElmsCount, DreamMaxHeight, DreamObjectDetalization, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { NoizeShader } from "@_services/dream-map/shaders/noise";
import { BufferGeometry, Clock, Color, DataTexture, Float32BufferAttribute, FrontSide, LinearEncoding, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Ray, Shader, Texture, TextureLoader, Triangle, Vector2, Vector3 } from "three";





export class DreamMapTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  // Под тип
  static override getSubType(ceil: DreamMapCeil, neighboringCeils: ClosestHeights, type: string): string {
    return "123";
  }





  private type: string = "tree";
  private subType: Types;

  private count: number = 0;
  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private posRange: number = 0.3;
  private maxHeight: number = this.heightPart * DreamMaxHeight;
  private noize: number = 0.2;

  private width: number = 1;
  private height: number = 1;

  private params: Params;





  // Полный тип
  private get fullType(): string {
    return this.type + "-" + this.subType;
  }

  // Получение объекта
  getObject(): MapObject[] {
    const {
      objHeight,
      cX,
      cY,
      qualityHelper,
      hyp,
      v1,
      v2,
      dir,
      ray,
      intersect,
      faces,
    }: Params = this.getParams;
    // Параметры
    const centerY: number = objHeight / 2;
    const centerX: number = DreamCeilSize / 2;
    const scale: number = Random(0.8, 1.1, false, 3);
    const lX: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const lY: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const x: number = cX + lX;
    const y: number = cY + lY;
    // Параметры местности
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
    // Координата Z
    const z: number = intersect.z + (centerY * scale);
    // Вернуть массив объектов
    return [
      this.getVerticalParts(lX, lY, scale, z)
    ];
  }

  // Горизонтальные части
  private getHorizontalParts(lX: number, lY: number, scale: number): void {
    const {
      objHeight,
      dummy,
      material,
      geometry: { h: geometry },
      widthCorrect,
      borderOSize,
      cX,
      cY,
      countItterator,
      quality,
      vertexItterator,
      vertexVector3,
      vertexes,
      wdth,
      facesCountItterator,
      qualityHelper,
      facesTriangle,
      hyp,
      v1,
      v2,
      dir,
      ray,
      intersect,
      faces,
    }: Params = this.getParams;
    // Параметры
    const x: number = cX + lX;
    const y: number = cY + lY;
  }

  // Вертикальные части
  private getVerticalParts(lX: number, lY: number, scale: number, z: number): MapObject {
    const {
      dummy,
      material,
      geometry: { v: geometry },
      cX,
      cY,
      countItterator,
    }: Params = this.getParams;
    // Параметры
    const type: string = this.fullType + "-v";
    const angle: number = 360 / this.count;
    const x: number = cX + lX;
    const y: number = cY + lY;
    // Настройки
    dummy.position.set(x, z, y);
    dummy.scale.setScalar(scale);
    geometry.rotateY(AngleToRad(180));
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = countItterator.map(i => {
      dummy.rotation.y = AngleToRad(i * angle);
      dummy.updateMatrix();
      // Вернуть геометрию
      return new Matrix4().copy(dummy.matrix);
    });
    // Вернуть объект
    return {
      type,
      subType: DreamMapTreeObject.getSubType(this.ceil, this.neighboringCeils, type),
      count: this.count,
      matrix: matrix,
      color: [],
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

  // Определение параметров
  private get getParams(): Params {
    this.subType = this.ceil?.object && TypesByID[this.ceil.object] ? TypesByID[this.ceil.object] : Object.values(TypesByID)[0];
    this.height = Heights[this.subType] * DreamCeilParts;
    this.count = Counts[DreamObjectDetalization];
    // Параметры уже существуют
    if (!!this.params) {
      this.params.cX = this.params.widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      this.params.cY = this.params.heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      this.params.countItterator = CreateArray(this.count);
    }
    // Определить параметры
    else {
      const objWidth: number = this.width * this.widthPart;
      const objHeight: number = this.height * this.heightPart;
      // Данные фигуры
      const vGeometry: PlaneGeometry = new PlaneGeometry(objWidth, objHeight, 1, 1);
      const hGeometry: PlaneGeometry = new PlaneGeometry(objWidth, objWidth, 1, 1);
      const map: Texture = new TextureLoader().load(ObjectTexturePaths(this.type, "face") + this.subType + ".png", map => map.encoding = LinearEncoding);
      const normalMap: Texture = new TextureLoader().load(ObjectTexturePaths(this.type, "normal") + this.subType + ".jpg");
      const material: MeshStandardMaterial = this.alphaFogService.getMaterial(new MeshStandardMaterial({
        map,
        normalMap,
        normalScale: new Vector2(1, 1),
        aoMap: normalMap,
        aoMapIntensity: -1,
        color: new Color(1, 1, 1),
        fog: true,
        transparent: true,
        alphaTest: 0.7,
        side: FrontSide,
        flatShading: true,
      })) as MeshStandardMaterial;
      const dummy: Object3D = new Object3D();
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
      const facesTriangle: Triangle[] = facesCountItterator.map(() => new Triangle());
      const vertexVector3: Vector3[] = vertexItterator.map(() => vertexItterator.map(() => 0)).reduce((o, v) => ([...o, ...v]), []).map(() => new Vector3());
      const v1: Vector3 = new Vector3();
      const v2: Vector3 = new Vector3();
      const dir = new Vector3();
      const ray: Ray = new Ray();
      const intersect: Vector3 = new Vector3();
      const countItterator: number[] = CreateArray(this.count);
      // Настройки
      vGeometry.setAttribute("uv2", vGeometry.getAttribute("uv"));
      // Запомнить параметры
      this.params = {
        objWidth,
        objHeight,
        geometry: {
          v: vGeometry,
          h: hGeometry
        },
        material,
        dummy,
        terrainGeometry,
        oWidth,
        oHeight,
        widthCorrect,
        heightCorrect,
        borderOSize,
        cX,
        cY,
        countItterator,
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
        map,
        normalMap,
        vertex: [],
        faces: [],
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
    // Количество объектов
    this.count = DreamMaxElmsCount(this.dreamMapSettings.detalization);
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
    // Количество объектов
    this.count = DreamMaxElmsCount(this.dreamMapSettings.detalization);
    // Вернуть экземпляр
    return this;
  }

  // Обновить позицию по оси Z
  updateHeight(objectSetting: ObjectSetting): void {
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
        NoizeShader(this.params.material, shader, this.noize, false);
        this.params.shader = shader;
      };
    }
  }
}





// Интерфейс параметров для расчетов
interface Params {
  objWidth: number;
  objHeight: number;
  geometry: {
    v: PlaneGeometry,
    h: PlaneGeometry
  };
  material: MeshStandardMaterial;
  dummy: Object3D;
  terrainGeometry: PlaneGeometry;
  oWidth: number;
  oHeight: number;
  widthCorrect: number;
  heightCorrect: number;
  borderOSize: number;
  cX: number;
  cY: number;
  countItterator: number[];
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
  map: Texture;
  normalMap: Texture;
  shader?: Shader;
}

// Типы деревьев
type Types = "oak";

// Тип по ID
const TypesByID: CustomObjectKey<number, Types> = {
  [1]: "oak"
};

// Список высот по типу дерева
const Heights: CustomObjectKey<Types, number> = {
  oak: 2
};

// Список количества повторов текстуры
const Counts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: 4,
  [DreamObjectElmsValues.Low]: 4,
  [DreamObjectElmsValues.Middle]: 6,
  [DreamObjectElmsValues.High]: 6,
  [DreamObjectElmsValues.VeryHigh]: 6,
  [DreamObjectElmsValues.Ultra]: 8,
  [DreamObjectElmsValues.Awesome]: 8,
};
