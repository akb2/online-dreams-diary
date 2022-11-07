import { AngleToRad, Cos, CreateArray, CustomObjectKey, IsEven, IsMultiple, LineFunc, MathRound, Random, Sin, TriangleSquare } from "@_models/app";
import { ClosestHeight, ClosestHeights, DreamMap, DreamMapCeil, XYCoord } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxElmsCount, DreamMaxHeight, DreamObjectDetalization, DreamObjectElmsValues } from "@_models/dream-map-settings";
import { TriangleGeometry } from "@_models/three.js/triangle.geometry";
import { DreamMapAlphaFogService, FogFragmentShader } from "@_services/dream-map/alphaFog.service";
import { MapObject, ObjectSetting } from "@_services/dream-map/object.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { BufferGeometry, Clock, Color, DataTexture, DoubleSide, Float32BufferAttribute, Matrix4, Mesh, MeshPhongMaterial, Object3D, PlaneGeometry, Ray, Shader, Side, Triangle, Vector3 } from "three";





export class DreamMapGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


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





  private count: number = DreamObjectDetalization === DreamObjectElmsValues.VeryLow ? 0 : DreamMaxElmsCount;

  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;

  private width: number = 0.044;
  private height: number = 10;
  private noise: number = 0.2;
  private scaleY: number[] = [1, 3];
  private scaleX: number[] = [1.6, 0.9];
  private noizeRotate: number = 90 * this.noise;
  private rotationRadiusRange: number = 20;
  private side: Side = DoubleSide;

  private color: Color = new Color(0.3, 1, 0.2);
  private maxHeight: number = this.heightPart * DreamMaxHeight;

  private params: Params;

  private randomFactor: number = 3;
  private bordersX: CustomObjectKey<number, number[]> = { 0: [-0.5, 0], 180: [0, 0.5] };
  private bordersY: CustomObjectKey<number, number[]> = { 90: [-0.5, 0], 270: [0, 0.5] };
  private a: XYCoord = { x: 0, y: 0 };
  private b: XYCoord = { x: 1, y: 0 };
  private c: XYCoord = { x: 0, y: 1 };
  private d: XYCoord = { x: 1, y: 1 };
  private trianglesCoords: CustomObjectKey<number, XYCoord[]> = {
    0: [this.a, this.b, this.c],
    90: [this.a, this.b, this.d],
    180: [this.a, this.c, this.d],
    270: [this.b, this.c, this.d]
  };





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
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = countItterator.map(() => {
      const lX: number = Random(0, DreamCeilSize, true, 5);
      const lY: number = Random(0, DreamCeilSize, true, 5);
      const x: number = cX + lX;
      const y: number = cY + lY;
      // Проверка вписания в фигуру
      if (this.checkCeilForm(cX, cY, x, y)) {
        const scaleY: number = Random(this.scaleY[0], this.scaleY[1], false, 5);
        const scaleX: number = LineFunc(this.scaleX[0], this.scaleX[1], scaleY, this.scaleY[0], this.scaleY[1]);
        const rotationRadius: number = Random(0, this.rotationRadiusRange, false, 5);
        const rotationAngle: number = Random(0, 360);
        // Настройки
        dummy.position.set(x, this.getHeight(x, y), y);
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
      type: "grass",
      subType: DreamMapGrassObject.getSubType(this.ceil, this.neighboringCeils),
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
      const objWidth: number = this.width * this.widthPart;
      const objHeight: number = this.height * this.heightPart;
      const hyp2: number = objWidth / 2;
      const leg: number = Math.sqrt(Math.pow(hyp2, 2) + Math.pow(objHeight, 2));
      // Данные фигуры
      const geometry: TriangleGeometry = new TriangleGeometry(leg, objWidth, leg);
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
  ): DreamMapGrassObject {
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
        // Вершинный шейдер
        shader.vertexShader = `
          #define STANDARD

          varying vec2 vUv;
          varying vec3 vViewPosition;
          uniform float time;

          #ifdef USE_TRANSMISSION
            varying vec3 vWorldPosition;
          #endif

          #include <common>
          #include <uv_pars_vertex>
          #include <uv2_pars_vertex>
          #include <displacementmap_pars_vertex>
          #include <color_pars_vertex>
          #include <fog_pars_vertex>
          #include <normal_pars_vertex>
          #include <morphtarget_pars_vertex>
          #include <skinning_pars_vertex>
          #include <shadowmap_pars_vertex>
          #include <logdepthbuf_pars_vertex>
          #include <clipping_planes_pars_vertex>

          float N (vec2 st) {
            return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
          }

          float smoothNoise( vec2 ip ){
            vec2 lv = fract( ip );
            vec2 id = floor( ip );

            lv = lv * lv * ( 3. - 2. * lv );

            float bl = N( id );
            float br = N( id + vec2( 1, 0 ));
            float b = mix( bl, br, lv.x );

            float tl = N( id + vec2( 0, 1 ));
            float tr = N( id + vec2( 1, 1 ));
            float t = mix( tl, tr, lv.x );

            return mix( b, t, lv.y );
          }

          void main() {
            vUv = uv;
            float t = time * 2.;

            #include <color_vertex>
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
            #include <normal_vertex>
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            #include <displacementmap_vertex>

            // VERTEX POSITION
            vec4 mvPosition = vec4( transformed, 1.0 );
            #ifdef USE_INSTANCING
              mvPosition = instanceMatrix * mvPosition;
            #endif

            // DISPLACEMENT
            float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
            noise = pow(noise * 0.5 + 0.5, 2.) * 2.;

            // here the displacement is made stronger on the blades tips.
            float dispPower = 1. - cos( uv.y * 3.1416 * ${MathRound(this.noise, 4).toFixed(4)} );

            float displacement = noise * ( 0.3 * dispPower );
            mvPosition.z += displacement;

            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;

            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            vViewPosition = - mvPosition.xyz;
            #include <worldpos_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>

            #ifdef USE_TRANSMISSION
              vWorldPosition = worldPosition.xyz;
            #endif
          }
        `;
        // Данные
        shader.uniforms = {
          ...shader.uniforms,
          time: { value: 0 }
        };
        // Туман
        shader.fragmentShader = shader.fragmentShader.replace("#include <fog_fragment>", FogFragmentShader);
        // Запомнить шейдер
        this.params.shader = shader;
        this.params.material.userData.shader = shader;
        this.params.material.transparent = true;
        this.params.material.fog = true;
      };
    }
  }





  // Проверка вписания травы в плавную фигуру с учетом соседних ячеек
  private checkCeilForm(cX: number, cY: number, x: number, y: number): boolean {
    const randomCheck: boolean = Random(1, 100) <= this.randomFactor;
    // Проверка соседних ячеек, если не фактор случайности не сработал
    if (!randomCheck) {
      const closestCeils: ClosestHeight[] = ClosestKeysAll.map(k => this.neighboringCeils[k]).filter(c => c.terrain === this.ceil.terrain);
      const closestCount: number = closestCeils.length;
      const closestKeys: (keyof ClosestHeights)[] = ClosestKeysAll.filter(k => this.neighboringCeils[k].terrain === this.ceil.terrain);
      // Отрисовка только для существующих типов фигур
      if (closestCount < CeilGrassFillGeometry.length && !!CeilGrassFillGeometry[closestCount]) {
        // Для ячеек без похожих соседних ячеек
        if (closestCount === 0) {
          return this.checkCeilCircleForm(cX, cY, x, y);
        }
        // Для ячеек с одной похожей геометрией
        else if (closestCount === 1) {
          const angle: number = AnglesA[closestKeys[0]];
          // Тест геометрии
          return this.checkCeilHalfCircleForm(cX, cY, x, y, angle);
        }
        // Для ячеек с двумя похожими геометриями
        else if (closestCount === 2) {
          const angle: number = AnglesB[closestKeys[0]][closestKeys[1]] ?? -1;
          // Обрабатывать только те ячейки где одинаковые соседние типы местности в разных координатах
          if (angle >= 0) {
            const corners: (keyof ClosestHeights)[] = AllCorners[closestKeys[0]][closestKeys[1]];
            const cornersCount: number = corners.map(k => this.neighboringCeils[k]).filter(c => c.terrain === this.ceil.terrain).length;
            // Посчитать
            return cornersCount > 0 ?
              this.checkCeilTriangleForm(cX, cY, x, y, angle) :
              this.checkCeilQuarterCircleForm(cX, cY, x, y, angle);
          }
        }
      }
    }
    // Координата вписывается в фигуру
    return true;
  }

  // Проверка круговой геометрии
  private checkCeilCircleForm(cX: number, cY: number, oX: number, oY: number): boolean {
    const radius: number = DreamCeilSize / 2;
    const x: number = oX - cX - radius;
    const y: number = oY - cY - radius;
    // Результат
    return Math.pow(x, 2) + Math.pow(y, 2) < Math.pow(radius, 2);
  }

  // Проверка полукруговой геометрии
  private checkCeilHalfCircleForm(cX: number, cY: number, oX: number, oY: number, angle: number): boolean {
    const borderDef: number[] = [-0.5, 0.5];
    const borderX: number[] = this.bordersX[angle] ?? borderDef;
    const borderY: number[] = this.bordersY[angle] ?? borderDef;
    const radius: number = DreamCeilSize / 2;
    const x: number = oX - cX - radius;
    const y: number = oY - cY - radius;
    // Результат
    return x >= borderX[0] && x <= borderX[1] && y >= borderY[0] && y <= borderY[1] ?
      true :
      this.checkCeilCircleForm(cX, cY, oX, oY);
  }

  // Проверка треугольной геометрии
  private checkCeilTriangleForm(cX: number, cY: number, oX: number, oY: number, angle: number): boolean {
    const triangle: XYCoord[] = this.trianglesCoords[angle];
    // Проверка внутри треугольника
    if (!!triangle) {
      const traingleSquare: number = MathRound(TriangleSquare(triangle), 5);
      const x: number = oX - cX;
      const y: number = oY - cY;
      const checkCoord: XYCoord = { x, y };
      const checkCoords: XYCoord[][] = [
        [checkCoord, triangle[1], triangle[2]],
        [triangle[0], checkCoord, triangle[2]],
        [triangle[0], triangle[1], checkCoord],
      ];
      const checkSquaries: number = MathRound(checkCoords.map(c => TriangleSquare(c)).reduce((s, o) => s + o, 0), 5);
      // Вписывается
      return traingleSquare === checkSquaries;
    }
    // Не вписывается
    return false;
  }

  // Проверка геометрии четверти круга
  private checkCeilQuarterCircleForm(cX: number, cY: number, oX: number, oY: number, angle: number): boolean {
    const radius: number = DreamCeilSize;
    const subtractorY: number = angle === 180 || angle === 270 ? -1 : 0;
    const subtractorX: number = Math.abs((angle === 90 || angle === 180 ? -1 : 0) - subtractorY) * -1;
    const x: number = oX - cX + subtractorX;
    const y: number = oY - cY + subtractorY;
    // Результат
    return Math.pow(x, 2) + Math.pow(y, 2) < Math.pow(radius, 2);
  }
}





// Интерфейс параметров для расчетов
interface Params {
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

// Перечисление типов геометрий травы для ячеек
type CeilGrassFillGeometryType = "circle" | "half-circle" | "triangle" | false;
const CeilGrassFillGeometry: CeilGrassFillGeometryType[] = [
  "circle",
  "half-circle",
  "triangle",
];


const ClosestKeysAll: (keyof ClosestHeights)[] = ["top", "right", "bottom", "left"];
const AnglesA: CustomObjectKey<keyof ClosestHeights, number> = { top: 90, right: 180, bottom: 270, left: 0 };
const AnglesB: CustomObjectKey<keyof ClosestHeights, CustomObjectKey<keyof ClosestHeights, number>> = {
  top: { left: 0, right: 90 },
  left: { top: 0, bottom: 180 },
  right: { top: 90, bottom: 270 },
  bottom: { left: 180, right: 270 },
};
const AllCorners: CustomObjectKey<keyof ClosestHeights, CustomObjectKey<keyof ClosestHeights, (keyof ClosestHeights)[]>> = {
  top: { left: ["topRight", "bottomLeft"], right: ["topLeft", "bottomRight"] },
  left: { top: ["topRight", "bottomLeft"], bottom: ["topLeft", "bottomRight"] },
  right: { top: ["topLeft", "bottomRight"], bottom: ["topRight", "bottomLeft"] },
  bottom: { left: ["topLeft", "bottomRight"], right: ["topRight", "bottomLeft"] },
};
