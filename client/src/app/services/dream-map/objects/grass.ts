import { AngleToRad } from "@_models/app";
import { DreamMap, DreamMapCeil } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { DreamCeilParts, DreamCeilSize, DreamMapSize, DreamMaxHeight } from "@_services/dream.service";
import { Clock, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Mesh, Object3D, PlaneGeometry, Ray, ShaderMaterial, Triangle, Vector3 } from "three";





export class DreamMapGrassObject extends DreamMapObjectTemplate implements DreamMapObjectTemplate {


  private count: number = 100;
  private width: number = DreamCeilSize * 0.002;
  private height: number = DreamCeilSize / DreamCeilParts * 10;
  private heightPart: number = DreamCeilSize / DreamCeilParts;
  private maxHeight: number = this.heightPart * DreamMaxHeight;

  private material: ShaderMaterial;





  constructor(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementCanvas: HTMLCanvasElement,
    neighboringCeils: DreamMapCeil[] = []
  ) {
    super(dreamMap, ceil, terrain, clock, alphaFogService, displacementCanvas, neighboringCeils);
  }





  // Получение объекта
  getObject(): Group {
    this.material = this.alphaFogService.getShaderMaterial(new ShaderMaterial({
      vertexShader: VertexShader,
      fragmentShader: FragmentShader,
      uniforms: { time: { value: 0 } },
      defines: {
        USE_FOG: false
      },
      side: DoubleSide,
    }));
    // Параметры
    const oWidth: number = this.dreamMap.size.width ?? DreamMapSize;
    const oHeight: number = this.dreamMap.size.height ?? DreamMapSize;
    const ceils: DreamMapCeil[] = Array.from(Array(oHeight).keys()).map(y => Array.from(Array(oWidth).keys())
      .map(x => this.getCeil(x, y)))
      .reduce((o, c) => ([...o, ...c]), [])
      .filter(c => !c.object?.id)
      .filter(({ terrain }) => terrain === 1);
    const widthCorrect: number = -oWidth * DreamCeilSize / 2;
    const heightCorrect: number = -oHeight * DreamCeilSize / 2;
    const group: Group = new Group();
    const dummy: Object3D = new Object3D();
    const geometry: PlaneGeometry = new PlaneGeometry(this.width, this.height, 1, 3);
    const mesh = new InstancedMesh(geometry, this.material, this.count * ceils.length);
    const terrainGeometry: PlaneGeometry = this.terrain.geometry as PlaneGeometry;
    const vertexes: Float32BufferAttribute = terrainGeometry.getAttribute("position") as Float32BufferAttribute;
    const quality: number = (terrainGeometry.parameters.widthSegments / terrainGeometry.parameters.width) + 1;
    const qualityHelper: number = quality - 1;
    const wdth: number = terrainGeometry.parameters.widthSegments + 1;
    const hgth: number = terrainGeometry.parameters.heightSegments + 1;
    const borderOSize: number = (terrainGeometry.parameters.width - oWidth) / 2;
    const vertexItterator: number[] = Array.from(Array(quality).keys());
    const facesCount: number = Math.pow(quality - 1, 2) * 2;
    const hyp: number = Math.sqrt(Math.pow(DreamCeilSize / qualityHelper, 2) * 2);
    // Настройки
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.matrixAutoUpdate = false;
    // Функция анимации
    group.userData.animate = this.animate.bind(this);
    // Цикл по ячейкам
    ceils.forEach((ceil, k) => {
      const cX: number = widthCorrect + (ceil.coord.x * DreamCeilSize);
      const cY: number = heightCorrect + (ceil.coord.y * DreamCeilSize);
      const vertex: Vector3[] = vertexItterator.map(h => borderOSize + (cY - widthCorrect) + h)
        .map(h => vertexItterator.map(w => borderOSize + (cX - widthCorrect) + w).map(w => (h * wdth) + w))
        .reduce((o, v) => ([...o, ...v]), [])
        .map(i => new Vector3(vertexes.getX(i), -vertexes.getY(i), vertexes.getZ(i)))
        .sort((a, b) => {
          const rA: number = a.y * quality + a.x;
          const rB: number = b.y * quality + b.x;
          return rA > rB ? 1 : rA < rB ? -1 : 0
        });
      const faces: Triangle[] = Array.from(Array(facesCount).keys())
        .map(i => new Triangle(vertex[i], vertex[i + 1], vertex[i + 2]));
      // Цикл по количеству фрагментов
      Array.from(Array(this.count).keys()).forEach(i => {
        const index: number = (k * this.count) + i;
        const lX: number = (Math.random() * DreamCeilSize);
        const lY: number = (Math.random() * DreamCeilSize);
        const xSeg: number = Math.floor(lX * qualityHelper);
        const ySeg: number = Math.floor(lY * qualityHelper);
        const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
        const seg: number = locHyp >= hyp ? 1 : 0;
        const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
        const x: number = cX + lX;
        const y: number = cY + lY;
        const v1: Vector3 = new Vector3(x, y, 0);
        const v2: Vector3 = new Vector3(x, y, this.maxHeight);
        var dir = new Vector3();
        dir.subVectors(v2, v1).normalize();
        dir.normalize();
        const ray: Ray = new Ray(v1, dir);
        let intersect: Vector3 = new Vector3();
        ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
        const z: number = intersect.z;
        // Настройки
        dummy.position.set(x, z, y);
        dummy.rotation.y = Math.random() * AngleToRad(180);
        dummy.scale.setScalar(0.5 + Math.random() * 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
    });
    // Настройки
    group.position.set(0, 0, 0);
    group.add(mesh);
    // Вернуть группу
    return group;
  }





  // Анимация
  animate(): void {
    this.material.uniforms.time.value = this.clock.getElapsedTime();
    this.material.uniformsNeedUpdate = true;
  }
}





// Вершиныый шейдер
const VertexShader: string = `
  varying vec2 vUv;
  uniform float time;

  #include <common>
  #include <fog_pars_vertex>

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

    // DISPLACEMENT

    float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
    noise = pow(noise * 0.2 + 0.2, 2.) * 1.;

    // here the displacement is made stronger on the blades tips.
    float dispPower = 1. - cos( uv.y * 3.1416 * 0.5 );

    float displacement = noise * ( 0.3 * dispPower );
    mvPosition.z -= displacement;

    //

    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

    #include <fog_vertex>
	}
`;

// Фрагментный шейдер
const FragmentShader: string = `
  varying vec2 vUv;

  #include <common>
  #include <fog_pars_fragment>

  void main() {
    vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
    float clarity = ( vUv.y * 0.875 ) + 0.125;
    gl_FragColor = vec4( baseColor * clarity, 1 );

    #include <fog_fragment>
  }
`;
