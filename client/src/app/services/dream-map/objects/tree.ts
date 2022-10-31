import { AngleToRad, CustomObjectKey, IsEven, IsMultiple, MathRound, Random } from "@_models/app";
import { DreamMap, DreamMapCeil, ObjectTexturePaths } from "@_models/dream-map";
import { DreamMapAlphaFogService, FogFragmentShader } from "@_services/dream-map/alphaFog.service";
import { MapObject } from "@_services/dream-map/object.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxElmsCount, DreamMaxHeight, DreamObjectDetalization, DreamObjectElmsValues } from "@_services/dream.service";
import { BufferGeometry, Clock, Color, DoubleSide, Float32BufferAttribute, LinearEncoding, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Ray, Shader, Texture, TextureLoader, Triangle, Vector2, Vector3 } from "three";





export class DreamMapTreeObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private type: string = "tree";
  private subType: Types;

  private count: number = DreamMaxElmsCount;
  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private posRange: number = 0.3;
  private maxHeight: number = this.heightPart * DreamMaxHeight;
  private noise: number = 0.2;

  private width: number = 1;
  private height: number = 1;

  private params: Params;





  // Полный тип
  private get fullType(): string {
    return this.type + "-" + this.subType;
  }

  // Получение объекта
  getObject(): MapObject {
    const {
      objHeight,
      dummy,
      material,
      geometry,
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
      intersect
    }: Params = this.getParams;
    // Параметры
    const angle: number = 180 / this.count;
    const centerX: number = DreamCeilSize / 2;
    const centerY: number = objHeight / 2;
    const lX: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const lY: number = centerX + Random(-this.posRange, this.posRange, true, 5);
    const x: number = cX + lX;
    const y: number = cY + lY;
    // Параметры местности
    const vertex: Vector3[] = vertexItterator.map(h => borderOSize + (cY - widthCorrect) + h)
      .map(h => vertexItterator.map(w => borderOSize + (cX - widthCorrect) + w).map(w => (h * wdth) + w))
      .reduce((o, v) => ([...o, ...v]), [])
      .map((i, k) => vertexVector3[k].set(vertexes.getX(i), -vertexes.getY(i), vertexes.getZ(i)))
      .sort((a, b) => {
        const rA: number = a.y * quality + a.x;
        const rB: number = b.y * quality + b.x;
        return rA > rB ? 1 : rA < rB ? -1 : 0
      });
    let vertexStart: number = 0;
    const faces: Triangle[] = facesCountItterator.map(i => {
      const isOdd: boolean = IsEven(i);
      const isEnd: boolean = IsMultiple(i + 1, quality) && i > 0;
      const a: number = vertexStart;
      const b: number = isOdd ? vertexStart + 1 : vertexStart + qualityHelper;
      const c: number = vertexStart + qualityHelper + 1;
      // Увеличить инкримент
      vertexStart = isOdd || isEnd ? vertexStart + 1 : vertexStart;
      // Вернуть сторону
      return facesTriangle[i].set(vertex[a], vertex[b], vertex[c]);
    });
    const xSeg: number = Math.floor(lX * qualityHelper);
    const ySeg: number = Math.floor(lY * qualityHelper);
    const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
    const seg: number = locHyp >= hyp ? 1 : 0;
    const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
    const scale: number = Random(0.8, 1.1, false, 3);
    // Поиск координаты Z
    v1.set(x, y, 0);
    v2.set(x, y, this.maxHeight);
    dir.subVectors(v2, v1).normalize();
    dir.normalize();
    ray.set(v1, dir);
    ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
    // Координата Z
    const z: number = intersect.z + (centerY * scale);
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
      type: this.fullType,
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
      recieveShadow: true
    };
  }

  // Определение параметров
  private get getParams(): Params {
    this.subType = this.ceil?.object?.id && TypesByID[this.ceil.object.id] ? TypesByID[this.ceil.object.id] : Object.values(TypesByID)[0];
    this.height = Heights[this.subType] * DreamCeilParts;
    this.count = Counts[DreamObjectDetalization];
    // Параметры уже существуют
    if (!!this.params) {
      this.params.cX = this.params.widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      this.params.cY = this.params.heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      this.params.countItterator = Array.from(Array(this.count).keys());
    }
    // Определить параметры
    else {
      const objWidth: number = this.width * this.widthPart;
      const objHeight: number = this.height * this.heightPart;
      // Данные фигуры
      const geometry: PlaneGeometry = new PlaneGeometry(objWidth, objHeight, 1, 1);
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
        side: DoubleSide,
        flatShading: true,
      })) as MeshStandardMaterial;
      const dummy: Object3D = new Object3D();
      // Параметры
      const terrainGeometry: PlaneGeometry = this.terrain.geometry as PlaneGeometry;
      const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
      const qualityHelper: number = quality - 1;
      const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
      const vertexItterator: number[] = Array.from(Array(quality).keys());
      const facesCount: number = Math.pow(quality - 1, 2) * 2;
      const facesCountItterator: number[] = Array.from(Array(facesCount).keys());
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
      const countItterator: number[] = Array.from(Array(this.count).keys());
      // Настройки
      geometry.setAttribute("uv2", geometry.getAttribute("uv"));
      // Запомнить параметры
      this.params = {
        objWidth,
        objHeight,
        geometry,
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
      };
      // Создание шейдера
      this.createShader();
    }
    // Вернуть данные
    return this.params;
  }





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[] = []
  ) {
    super(
      dreamMap,
      ceil,
      terrain,
      clock,
      alphaFogService,
      displacementCanvas,
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
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[] = []
  ): DreamMapTreeObject {
    this.dreamMap = dreamMap;
    this.ceil = ceil;
    this.terrain = terrain;
    this.clock = clock;
    this.alphaFogService = alphaFogService;
    this.displacementCanvas = displacementCanvas;
    this.neighboringCeils = neighboringCeils;
    // Вернуть экземаляр
    return this;
  }

  // Очистка памяти
  destroy(): void {
    this.params.dummy.remove();
    delete this.params;
  }





  // Анимация
  animate(): void {
    this.params.shader.uniforms.time.value = this.clock.getElapsedTime();
  }

  // Создание шейдера движения
  private createShader(): void {
    if (!this.params.shader) {
      this.params.material.onBeforeCompile = shader => {
        // Вершинный шейдер
        shader.vertexShader = `
          #define STANDARD

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
}





// Интерфейс параметров для расчетов
interface Params {
  objWidth: number;
  objHeight: number;
  geometry: PlaneGeometry;
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
  [DreamObjectElmsValues.VeryLow]: 2,
  [DreamObjectElmsValues.Low]: 3,
  [DreamObjectElmsValues.Middle]: 4,
  [DreamObjectElmsValues.High]: 5,
  [DreamObjectElmsValues.VeryHigh]: 6,
  [DreamObjectElmsValues.Ultra]: 7,
  [DreamObjectElmsValues.Awesome]: 8,
};
