import { CustomObject } from "@_models/app";
import { Uniforms } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeVector2Uniform } from "@_threejs/base";
import { ObjectSpaceNormalMap, ShaderLib, UniformsUtils } from "three";



// Настройки паралакса
const ParallaxSteps = 16;
export const ParallaxScale = 2;

// Основные значения
const MaterialType: keyof typeof ShaderLib = "standard";
const BaseShader = ShaderLib[MaterialType];
export const WorldOceanRepeat = 70;

// Имена параметров
export const MaskTextureNamePreffix = "maskTex";
export const MapTextureName = "mapTexture";
export const NormalMapTextureName = "normalMapTexture";
export const AoMapTextureName = "aoMapTexture";
export const RoughnessMapTextureName = "roughnessMapTexture";
export const MetalnessMapTextureName = "metalnessMapTexture";
export const ParallaxMapTextureName = "parallaxMapTexture";

export const WorldOceanUniforms: Uniforms = UniformsUtils.merge([
  BaseShader.uniforms,
  {
    // Повторы
    b_one_repeat: ThreeVector2Uniform(1),
    // Прочее
    normalScale: ThreeVector2Uniform(3),
    normalMapType: ThreeFloatUniform(ObjectSpaceNormalMap),
    aoMapIntensity: ThreeFloatUniform(1),
    roughness: ThreeFloatUniform(1),
    metalness: ThreeFloatUniform(1),
    lightMapIntensity: ThreeFloatUniform(0.05),
    parallaxSteps: ThreeFloatUniform(ParallaxSteps),
    uTime: ThreeFloatUniform(0),
  }
]);

export const WorldOceanFragmentShader = `
  uniform vec2 tileSize;
  uniform vec2 tileSpacing;
  uniform vec2 tileSetSize;
  uniform vec2 mapRepeat;
  uniform float uTime;

  uniform sampler2D ${MapTextureName};

  varying float vDistanceToCamera;

  vec2 vec2LineFunc (vec2 min, vec2 max, vec2 v, vec2 vMin, vec2 vMax) {
    return (((v - vMin) / (vMax - vMin)) * (max - min)) + min;
  }

  vec4 getTextureData(sampler2D textureData, vec2 uv) {
    float speedA = 1.;
    float speedB = .8;
    float speedC = .1;
    float speedD = .02;
    float speedE = .013;

    vec2 coordsA = fract((uv + vec2(uTime, -uTime) / speedA) * mapRepeat * speedA);
    vec2 coordsB = fract((uv + vec2(-uTime, -uTime) / speedB) * mapRepeat * speedB);
    vec2 coordsC = fract((uv + vec2(0. , -uTime) / speedC) * mapRepeat * speedC);
    vec2 coordsD = fract((uv + vec2(-uTime * .15, -uTime) / speedD) * mapRepeat * speedD);
    vec2 coordsE = fract((uv + vec2(uTime * .15, -uTime) / speedE) * mapRepeat * speedE);

    vec4 textelA = texture(textureData, coordsA);
    vec4 textelB = texture(textureData, coordsB);
    vec4 textelC = texture(textureData, coordsC);
    vec4 textelD = texture(textureData, coordsD);
    vec4 textelE = texture(textureData, coordsE);
    vec4 textelAB = mix(textelA, textelB, .5);
    vec4 textelABC = mix(textelAB, textelC, .75);
    vec4 textelABCD = mix(textelABC, textelD, .75);
    vec4 textelABCDE = mix(textelABCD, textelE, .5);

    return textelABCDE;
  }

  #ifdef USE_AOMAP
    uniform sampler2D ${AoMapTextureName};
  #endif

  #ifdef USE_ROUGHNESSMAP
    uniform sampler2D ${RoughnessMapTextureName};
  #endif

  #ifdef USE_METALNESSMAP
    uniform sampler2D ${MetalnessMapTextureName};
  #endif

  ${BaseShader.fragmentShader
    // Координаты
    .replace("#include <uv_pars_fragment>", `
      #if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
        varying vec2 vUv;
        vec2 finalUv;
      #endif
    `)
    // Туман
    .replace("#include <fog_fragment>", `
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif

        gl_FragColor.a = saturate(gl_FragColor.a - fogFactor);
      #endif
    `)
    // ! Карта параллакса
    .replace("void main() {", `
      #if defined( USE_PARALLAXMAP )
        uniform sampler2D ${ParallaxMapTextureName};
        uniform float parallaxScale;
        uniform float parallaxSteps;
        uniform float parallaxDistance;

        vec2 parallaxMap(vec3 V) {
          float layerHeight = 1.0 / parallaxSteps;
          float currentLayerHeight = 0.0;
          vec2 dtex = parallaxScale * V.xy / V.z / parallaxSteps;
          vec2 currentTextureCoords = vUv;
          float heightFromTexture = getTextureData(${ParallaxMapTextureName}, currentTextureCoords).r;

          for ( int i = 0; i == 0; i += 0 ) {
            if ( heightFromTexture <= currentLayerHeight ) {
              break;
            }

            currentLayerHeight += layerHeight;
            currentTextureCoords -= dtex;
            heightFromTexture = getTextureData(${ParallaxMapTextureName}, currentTextureCoords).r;
          }

          vec2 prevTCoords = currentTextureCoords + dtex;
          float nextH = heightFromTexture - currentLayerHeight;
          float prevH = getTextureData(${ParallaxMapTextureName}, prevTCoords).r - currentLayerHeight + layerHeight;
          float weight = nextH / ( nextH - prevH );

          return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );
        }

				vec2 perturbUv( vec3 surfPosition, vec3 surfNormal, vec3 viewPosition ) {
					vec2 texDx = dFdx( vUv );
					vec2 texDy = dFdy( vUv );

					vec3 vSigmaX = dFdx( surfPosition );
					vec3 vSigmaY = dFdy( surfPosition );
					vec3 vR1 = cross( vSigmaY, surfNormal );
					vec3 vR2 = cross( surfNormal, vSigmaX );
					float fDet = dot( vSigmaX, vR1 );

					vec2 vProjVscr = ( 1.0 / fDet ) * vec2( dot( vR1, viewPosition ), dot( vR2, viewPosition ) );
					vec3 vProjVtex;
					vProjVtex.xy = texDx * vProjVscr.x + texDy * vProjVscr.y;
					vProjVtex.z = dot( surfNormal, viewPosition );

					return parallaxMap( vProjVtex );
				}
      #endif

      void main() {
        finalUv = vUv;

        #ifdef USE_PARALLAXMAP
          if (vDistanceToCamera < parallaxDistance) {
            finalUv = perturbUv(-vViewPosition, normalize(vNormal), normalize(vViewPosition));
          }
        #endif
    `)
    // ! Текстурная карта
    .replace("#include <map_fragment>", `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = getTextureData(${MapTextureName}, finalUv);
        #ifdef DECODE_VIDEO_TEXTURE
          sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
        #endif
        diffuseColor *= sampledDiffuseColor;
      #endif
    `)
    // ! Карта металичности
    .replace("#include <metalnessmap_fragment>", `
      float metalnessFactor = metalness;
      #ifdef USE_METALNESSMAP
        metalnessFactor *= getTextureData(${MetalnessMapTextureName}, finalUv).b;
      #endif
    `)
    // ! Карта шероховатости
    .replace("#include <roughnessmap_fragment>", `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        roughnessFactor *= getTextureData(${RoughnessMapTextureName}, finalUv).g;
      #endif
    `)
    // ! Карта атмосферного свечения
    .replace("#include <aomap_fragment>", `
      #ifdef USE_AOMAP
        float ambientOcclusion = (getTextureData(${AoMapTextureName}, finalUv).r - 1.) * aoMapIntensity + 1.;
        reflectedLight.indirectDiffuse *= ambientOcclusion;

        #if defined( USE_ENVMAP ) && defined( STANDARD )
          float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
          reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
        #endif
      #endif
    `)
    // ! Карта нормалей
    // Фрагмент 1
    .replace("#include <normalmap_pars_fragment>", `
      #ifdef USE_NORMALMAP
        uniform vec2 normalScale;
        uniform sampler2D ${NormalMapTextureName};

        vec3 perturbNormal2Arb (vec3 eye_pos, vec3 surf_norm) {
          vec3 q0 = vec3(dFdx(eye_pos.x), dFdx(eye_pos.y), dFdx(eye_pos.z));
          vec3 q1 = vec3(dFdy(eye_pos.x), dFdy(eye_pos.y), dFdy(eye_pos.z));
          vec2 st0 = dFdx(finalUv.st);
          vec2 st1 = dFdy(finalUv.st);
          vec3 S = normalize(q0 * st1.t - q1 * st0.t);
          vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
          vec3 N = normalize(surf_norm);
          vec4 full_normal = getTextureData(${NormalMapTextureName}, finalUv);
          vec3 mapN = full_normal.xyz * 2.0 - 1.0;
          mat3 tsn = mat3(S, T, N);

          mapN.xy = normalScale * mapN.xy;

          return normalize(tsn * mapN);
        }
      #endif
    `)
    // Фрагмент 2
    .replace("#include <normal_fragment_maps>", `
      #ifdef USE_CLEARCOAT
        vec3 clearcoatNormal = geometryNormal;
      #endif

      #ifdef USE_NORMALMAP
        normal = perturbNormal2Arb(-vViewPosition, normal);
      #endif
    `)
  }
`;

export const WorldOceanVertexShader = `
  varying float vDistanceToCamera;

  ${BaseShader.vertexShader
    // UV координаты
    .replace("void main() {", `
      void main() {
        vec2 MAP_UV = vUv;
        vec2 AOMAP_UV = vUv;
        vec2 NORMALMAP_UV = vUv;
        vec2 METALNESSMAP_UV = vUv;
        vec2 ROUGHNESSMAP_UV = vUv;
    `)
    // ! Карта паралакса
    .replace("#include <displacementmap_vertex>", `
      #include <displacementmap_vertex>
      vDistanceToCamera = length((modelViewMatrix * vec4( 1.0 )).xyz);
    `)
  }
`;

// Настройки шейдера материала
export const WorldOceanDefines: CustomObject<boolean> = {
  USE_UV: true,
  USE_TRANSMISSION: false,
  USE_MAP: true,
  USE_AOMAP: true,
  USE_NORMALMAP: true,
  USE_LIGHTMAP: false,
  USE_ROUGHNESSMAP: true,
  USE_METALNESSMAP: true,
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
};
