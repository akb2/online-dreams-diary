import { AngleToRad, IsEven, IsMultiple, MathRound, Random } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { TriangleGeometry } from "@_models/three.js/triangle.geometry";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { MapObject } from "@_services/dream-map/object.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxHeight, DreamObjectMaxElms } from "@_services/dream.service";
import { BufferGeometry, Clock, Color, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Ray, Shader, Triangle, Vector3 } from "three";





export class DreamMapGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private count: number = DreamObjectMaxElms;

  private widthPart: number = DreamCeilSize;
  private heightPart: number = DreamCeilSize / DreamCeilParts;

  private width: number = 0.02;
  private height: number = 12;
  private noise: number = 0.15;

  private color: Color = new Color(0.3, 1, 0.2);
  private maxHeight: number = this.heightPart * DreamMaxHeight;

  private params: Params;




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
  ): DreamMapGrassObject {
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





  // Получение объекта
  getObject(): MapObject {
    const {
      countItterator,
      dummy,
      material,
      geometry,
      quality,
      qualityHelper,
      hyp,
      vertexItterator,
      facesCountI,
      vertexes,
      wdth,
      widthCorrect,
      borderOSize,
      cX,
      cY,
      facesTriangle,
      vertexVector3,
      v1,
      v2,
      dir,
      ray,
      intersect
    }: Params = this.getParams;
    // Цикл по количеству фрагментов
    const matrix: Matrix4[] = countItterator.map(i => {
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
      const faces: Triangle[] = facesCountI.map(i => {
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
      const lX: number = (Math.random() * DreamCeilSize);
      const lY: number = (Math.random() * DreamCeilSize);
      const xSeg: number = Math.floor(lX * qualityHelper);
      const ySeg: number = Math.floor(lY * qualityHelper);
      const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
      const seg: number = locHyp >= hyp ? 1 : 0;
      const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
      const x: number = cX + lX;
      const y: number = cY + lY;
      // Поиск координаты Z
      v1.set(x, y, 0);
      v2.set(x, y, this.maxHeight);
      dir.subVectors(v2, v1).normalize();
      dir.normalize();
      ray.set(v1, dir);
      ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
      // Координата Z
      const z: number = intersect.z;
      // Настройки
      dummy.position.set(x, z, y);
      dummy.rotation.y = Math.random() * AngleToRad(180);
      dummy.scale.setScalar(Random(0.5, 1));
      dummy.updateMatrix();
      // Вернуть геометрию
      return new Matrix4().copy(dummy.matrix);
    });
    // Вернуть объект
    return {
      type: "grass",
      count: this.count,
      matrix,
      color: [],
      geometry: geometry as BufferGeometry,
      material,
      coords: {
        x: this.ceil.coord.x,
        y: this.ceil.coord.y
      },
      animate: this.animate.bind(this)
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
      const material: MeshStandardMaterial = new MeshStandardMaterial({ color: this.color });
      const dummy: Object3D = new Object3D();
      // Параметры
      const terrainGeometry: PlaneGeometry = this.terrain.geometry as PlaneGeometry;
      const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
      const qualityHelper: number = quality - 1;
      const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
      const vertexItterator: number[] = Array.from(Array(quality).keys());
      const facesCount: number = Math.pow(quality - 1, 2) * 2;
      const facesCountI: number[] = Array.from(Array(facesCount).keys());
      const vertexes: Float32BufferAttribute = terrainGeometry.getAttribute("position") as Float32BufferAttribute;
      const wdth: number = terrainGeometry.parameters.widthSegments + 1;
      // Параметры карты
      const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
      const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
      const widthCorrect: number = -oWidth * this.widthPart / 2;
      const heightCorrect: number = -oHeight * this.widthPart / 2;
      const borderOSize: number = (terrainGeometry.parameters.width - oWidth) / 2;
      // Координаты
      const cX: number = widthCorrect + (this.ceil.coord.x * DreamCeilSize);
      const cY: number = heightCorrect + (this.ceil.coord.y * DreamCeilSize);
      // Свойства для оптимизации
      const facesTriangle: Triangle[] = facesCountI.map(() => new Triangle());
      const vertexVector3: Vector3[] = vertexItterator.map(() => vertexItterator.map(() => 0)).reduce((o, v) => ([...o, ...v]), []).map(() => new Vector3());
      const v1: Vector3 = new Vector3();
      const v2: Vector3 = new Vector3();
      const dir = new Vector3();
      const ray: Ray = new Ray();
      const intersect: Vector3 = new Vector3();
      const countItterator: number[] = Array.from(Array(this.count).keys());
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
        facesTriangle,
        vertexVector3,
        v1,
        v2,
        dir,
        ray,
        intersect
      };
      // Создание шейдера
      this.createShader();
    }
    // Вернуть данные
    return this.params;
  }





  // Анимация
  animate(): void {
    this.params.shader.uniforms.time.value = this.clock.getElapsedTime();
  }

  // Создание шейдера движения
  private createShader(): void {
    if (!this.params.shader) {
      this.params.material.onBeforeCompile = shader => {
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

        float N (vec2 st) { // https://thebookofshaders.com/10/
          return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
        }

        float smoothNoise( vec2 ip ){ // https://www.youtube.com/watch?v=zXsWftRdsvU
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

          // VERTEX POSITION
          vec4 mvPosition = vec4( position, 1.0 );
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif

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

          // DISPLACEMENT
          float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
          noise = pow(noise * 0.5 + 0.5, 2.) * 2.;

          // here the displacement is made stronger on the blades tips.
          float dispPower = 1. - cos( uv.y * 3.1416 * ${MathRound(this.noise, 4).toFixed(4)} );

          float displacement = noise * ( 0.3 * dispPower );
          mvPosition.z -= displacement;

          #include <logdepthbuf_vertex>
          #include <clipping_planes_vertex>
          vViewPosition = - mvPosition.xyz;
          #include <worldpos_vertex>
          #include <shadowmap_vertex>
          #include <fog_vertex>

          #ifdef USE_TRANSMISSION
            vWorldPosition = worldPosition.xyz;
          #endif

          //

          vec4 modelViewPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * modelViewPosition;
        }
      `;
        // Данные
        shader.uniforms = {
          ...shader.uniforms,
          time: { value: 0 }
        };
        // Запомнить шейдер
        this.params.shader = shader;
      };
    }
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
  material: MeshStandardMaterial;
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
  facesTriangle: Triangle[];
  vertexVector3: Vector3[];
  v1: Vector3;
  v2: Vector3;
  dir: Vector3;
  ray: Ray;
  intersect: Vector3;
  shader?: Shader;
}
