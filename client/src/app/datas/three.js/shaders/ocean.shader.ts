import { CustomObject } from "@_models/app";
import { Uniforms } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeVector2Uniform } from "@_threejs/base";
import { ShaderLib } from "three";



const MaterialType: keyof typeof ShaderLib = "standard";
const BaseShader = ShaderLib[MaterialType];

export const WorldOceanUniforms: Uniforms = {
  uWaveScale: ThreeVector2Uniform(5, 5),
  uWaveSpeed: ThreeFloatUniform(1),
  uTime: ThreeFloatUniform(0)
};

export const WorldOceanFragmentShader = `
  uniform float uTime;
  uniform vec2 uWaveScale;
  uniform float uWaveSpeed;

  // Генерация шума для параллакса
  float parallaxWaveHeight(vec2 uv) {
    float wave1 = sin(uv.x * uWaveScale.x + uTime * uWaveSpeed) * 0.1;
    float wave2 = cos(uv.y * uWaveScale.y + uTime * uWaveSpeed * 0.5) * 0.1;

    return wave1 + wave2;
  }

  // Параллакс-смещение текстурных координат
  vec2 parallaxOffset(vec2 uv, vec3 viewDir, float scale) {
    float height = parallaxWaveHeight(uv);
    vec2 offset = scale * viewDir.xy * height;

    return uv + offset;
  }

  ${BaseShader.fragmentShader
    // Координаты
    .replace("#include <uv_pars_fragment>", `
      #if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
        varying vec2 vUv;
        vec2 finalUv;
      #endif
    `)
    //
    .replace("#include <map_fragment>", `
      #include <map_fragment>

      vec3 viewDir = normalize(vViewPosition); // Направление взгляда
      vec2 uvParallax = parallaxOffset(vUv, viewDir, 0.1); // Генерация смещения
      vec3 waterColor = vec3(0.0, 0.3, 0.5) + vec3(uvParallax.y * 0.1); // Цвет воды

      diffuseColor.rgb *= waterColor;
    `)
  }
`;

export const WorldOceanVertexShader = `
  uniform float uTime;
  uniform vec2 uWaveScale;
  uniform float uWaveSpeed;

  // Генерация шума для волн
  float waveHeight(vec2 pos) {
    float wave1 = sin(pos.x * uWaveScale.x + uTime * uWaveSpeed) * 0.1;
    float wave2 = cos(pos.y * uWaveScale.y + uTime * uWaveSpeed * 0.5) * 0.1;

    return wave1 + wave2;
  }

  // Вычисление нормали
  vec3 calculateNormal(vec3 position) {
    float delta = 0.01;
    float hL = waveHeight(position.xz - vec2(delta, 0.0));
    float hR = waveHeight(position.xz + vec2(delta, 0.0));
    float hD = waveHeight(position.xz - vec2(0.0, delta));
    float hU = waveHeight(position.xz + vec2(0.0, delta));
    vec3 normal = normalize(vec3(hL - hR, 2.0, hD - hU));

    return normal;
  }

  ${BaseShader.vertexShader
    // Паралакс
    .replace("#include <displacementmap_vertex>", `
      #include <displacementmap_vertex>

      float waveDisplacement = waveHeight(position.xz);
      vec3 displacedPosition = position + normal * waveDisplacement;
      vec3 displacedNormal = calculateNormal(displacedPosition);

      vNormal = displacedNormal;
      transformed = displacedPosition;
    `)
  }
`;

// Настройки шейдера материала
export const WorldOceanDefines: CustomObject<boolean> = {
  USE_UV: true,
  USE_TRANSMISSION: false,
  USE_MAP: false,
  USE_AOMAP: false,
  USE_NORMALMAP: false,
  USE_LIGHTMAP: false,
  USE_ROUGHNESSMAP: false,
  USE_METALNESSMAP: false,
  USE_PARALLAXMAP: true,
  USE_BUMPMAP: false,
  USE_DISPLACEMENTMAP: false,
  PHYSICALLY_CORRECT_LIGHTS: false,
  PHYSICAL: true,
  FLAT_SHADED: false,
  USE_TANGENT: true,
  DOUBLE_SIDED: false,
  USE_CLEARCOAT: false,
  USE_FOG: true,
  FOG_EXP2: false,
  USE_SHEEN: false,
  USE_ENVMAP: false
}
