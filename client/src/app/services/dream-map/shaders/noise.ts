import { MathRound } from "@_models/app";
import { FogFragmentShader } from "@_services/dream-map/alphaFog.service";
import { Material, Shader } from "three";





// Вершинный шейдер
const VertexShader: (noize: number, defineVuV?: boolean) => string = (noize: number, defineVuV: boolean = true) => `
  #define STANDARD

  ${defineVuV ? "varying vec2 vUv;" : ""}
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
    float dispPower = 1. - cos( uv.y * 3.1416 * ${MathRound(noize, 4).toFixed(4)} );

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





// Создание шейдера
export const NoizeShader: (material: Material, shader: Shader, noize: number, defineVuV?: boolean) => Shader = (
  material: Material,
  shader: Shader,
  noize: number,
  defineVuV: boolean = true
) => {
  // Вершинный шейдер
  shader.vertexShader = VertexShader(noize, defineVuV);
  // Данные
  shader.uniforms = {
    ...shader.uniforms,
    time: { value: 0 }
  };
  // Туман
  shader.fragmentShader = shader.fragmentShader.replace("#include <fog_fragment>", FogFragmentShader);
  // Запомнить шейдер
  material.transparent = true;
  material.fog = true;
  // Вернуть шейдер
  return shader;
};
