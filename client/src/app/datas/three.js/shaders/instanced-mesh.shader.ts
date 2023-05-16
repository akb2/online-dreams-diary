import { Shader, ShaderLib, UniformsUtils, Vector3 } from "three";





// Основные значения
const MaterialType: keyof typeof ShaderLib = "standard";
const BaseShader = ShaderLib[MaterialType];

// Ключи имен переменных в шейдере
export const InstancedShearShaderKey: string = "customShearMatrix";
export const InstancedDistanceShaderKey: string = "customLODDistance";

// Вершинный шейдер
const InstancedVertexShader = () => `
  #define STANDARD
  #define USE_TRANSMISSION

  varying vec3 vViewPosition;
  varying float vHide;

  uniform float time;
  uniform float noize;

  attribute vec3 ${InstancedShearShaderKey};
  attribute float ${InstancedDistanceShaderKey};

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
    float t = time * 2.;

    #ifdef USE_UV
      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
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
    #include <displacementmap_vertex>

    // VERTEX POSITION
    vec4 mvPosition = vec4( transformed, 1.0 );

    #ifdef USE_INSTANCING
      mat4 skewMatrix = mat4(
        1.0, ${InstancedShearShaderKey}.y, ${InstancedShearShaderKey}.z, 0.0,
        ${InstancedShearShaderKey}.x, 1.0, ${InstancedShearShaderKey}.z, 0.0,
        ${InstancedShearShaderKey}.x, -${InstancedShearShaderKey}.y, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
      );
      mvPosition = skewMatrix * mvPosition;
      mvPosition = instanceMatrix * mvPosition;
      mvPosition = modelViewMatrix * mvPosition;
    #else
      mvPosition = modelViewMatrix * mvPosition;
    #endif

    if (${InstancedDistanceShaderKey} < length(mvPosition.xyz)) {
      vHide = 1.;
    }

    else {
      if (noize > 0.) {
        float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
        noise = pow(noise * 0.5 + 0.5, 2.) * 2.;

        // here the displacement is made stronger on the blades tips.
        float dispPower = 1. - cos( uv.y * 3.1416 * noize );

        float displacement = noise * ( 0.3 * dispPower );
        mvPosition.z += displacement;
      }

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
  }
`;

// Фрагментный шейдер
const InstancedFragmentShader = () => `
  #define STANDARD

  #ifdef PHYSICAL
    #define IOR
    #define SPECULAR
  #endif

  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float roughness;
  uniform float metalness;
  uniform float opacity;

  #ifdef IOR
    uniform float ior;
  #endif

  #ifdef SPECULAR
    uniform float specularIntensity;
    uniform vec3 specularColor;
    #ifdef USE_SPECULARINTENSITYMAP
      uniform sampler2D specularIntensityMap;
    #endif
    #ifdef USE_SPECULARCOLORMAP
      uniform sampler2D specularColorMap;
    #endif
  #endif

  #ifdef USE_CLEARCOAT
    uniform float clearcoat;
    uniform float clearcoatRoughness;
  #endif

  #ifdef USE_SHEEN
    uniform vec3 sheenColor;
    uniform float sheenRoughness;
    #ifdef USE_SHEENCOLORMAP
      uniform sampler2D sheenColorMap;
    #endif
    #ifdef USE_SHEENROUGHNESSMAP
      uniform sampler2D sheenRoughnessMap;
    #endif
  #endif

  varying vec3 vViewPosition;

  #include <common>
  #include <packing>
  #include <dithering_pars_fragment>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <alphatest_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <emissivemap_pars_fragment>
  #include <bsdfs>
  #include <cube_uv_reflection_fragment>
  #include <envmap_common_pars_fragment>
  #include <envmap_physical_pars_fragment>
  #include <fog_pars_fragment>
  #include <lights_pars_begin>
  #include <normal_pars_fragment>
  #include <lights_physical_pars_fragment>
  #include <transmission_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <bumpmap_pars_fragment>
  #include <normalmap_pars_fragment>
  #include <clearcoat_pars_fragment>
  #include <roughnessmap_pars_fragment>
  #include <metalnessmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>

  varying float vHide;

  void main() {
    if(vHide >= 1.){
      discard;
    }

    else{
      #include <clipping_planes_fragment>

      vec4 diffuseColor = vec4( diffuse, opacity );
      ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
      vec3 totalEmissiveRadiance = emissive;

      #include <logdepthbuf_fragment>
      #include <map_fragment>
      #include <color_fragment>
      #include <alphamap_fragment>
      #include <alphatest_fragment>
      #include <roughnessmap_fragment>
      #include <metalnessmap_fragment>
      #include <normal_fragment_begin>
      #include <normal_fragment_maps>
      #include <clearcoat_normal_fragment_begin>
      #include <clearcoat_normal_fragment_maps>
      #include <emissivemap_fragment>
      #include <lights_physical_fragment>
      #include <lights_fragment_begin>
      #include <lights_fragment_maps>
      #include <lights_fragment_end>
      #include <aomap_fragment>

      vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
      vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

      #include <transmission_fragment>

      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

      #ifdef USE_CLEARCOAT
        float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
        vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
        outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
      #endif

      #include <output_fragment>
      #include <tonemapping_fragment>
      #include <encodings_fragment>

      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif

        gl_FragColor.a = saturate(gl_FragColor.a - fogFactor);
      #endif

      #include <premultiplied_alpha_fragment>
      #include <dithering_fragment>
    }
  }
`;

// Обновить весь шейдер
export const InstancedShader = (shader: Shader, noize: number) => {
  shader.vertexShader = InstancedVertexShader();
  shader.fragmentShader = InstancedFragmentShader();
  shader.uniforms = UniformsUtils.merge([shader.uniforms, {
    cameraPosition: { type: "v3", value: new Vector3() },
    cameraTarget: { type: "v3", value: new Vector3() },
    noize: { type: "f", value: noize },
    time: { type: "f", value: 0 }
  }]);
  // Обновленный шейдер
  return shader;
};
