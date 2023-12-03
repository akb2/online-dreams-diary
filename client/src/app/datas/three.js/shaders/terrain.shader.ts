import { MapTerrains } from "@_datas/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamFogFar, DreamFogNear } from "@_datas/dream-map-settings";
import { MapCycle } from "@_helpers/objects";
import { CapitalizeFirstLetter } from "@_helpers/string";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { MapTerrain, MapTerrainSplatMapColor } from "@_models/dream-map";
import { Uniforms } from "@_models/three.js/base";
import { ThreeFloatUniform, ThreeVector2Uniform } from "@_threejs/base";
import { ObjectSpaceNormalMap, ShaderLib, UniformsUtils } from "three";





// Основные значения
const TerrainColorCount = 4;
const ParallaxSteps = 50;
const ParallaxSize = 0.25;
const MaterialType: keyof typeof ShaderLib = "standard";
const BaseShader = ShaderLib[MaterialType];
const TerrainTileSize = 1536;
const TerrainTileSpacing = 512;
const TerrainTileSetSize = TerrainTileSize * 4;
export const TerrainRepeat = 0.5;
export const TerrainColorDepth = MapTerrains.filter((t, k) => k / TerrainColorCount === Math.round(k / TerrainColorCount)).length;

// Именованный массив
const CreateNamedArray = (key: string): string[] => MapTerrains.map(t => key + CapitalizeFirstLetter(t.name));

// Имена параметров
const MaskMapNamePreffix = "maskMap";
const MapTileCoordsName = "mapTileCoords";
const TerrainRepeatName = "terrainRepeat";
export const MaskTextureNamePreffix = "maskTex";
export const MapTextureName = "mapTexture";
export const NormalMapTextureName = "normalMapTexture";
export const AoMapTextureName = "aoMapTexture";
export const LightMapTextureName = "lightMapTexture";
export const RoughnessMapTextureName = "roughnessMapTexture";
export const MetalnessMapTextureName = "metalnessMapTexture";
export const ParallaxMapTextureName = "parallaxMapTexture";

// Массивы тайлов
const MapRepeats = CreateNamedArray(TerrainRepeatName);
const MapTexture = CreateNamedArray(MapTextureName);
const NormalMapTexture = CreateNamedArray(NormalMapTextureName);
const AoMapTexture = CreateNamedArray(AoMapTextureName);
const LightMap = CreateNamedArray(LightMapTextureName);
const RoughnessMapTexture = CreateNamedArray(RoughnessMapTextureName);
const MetalnessMapTexture = CreateNamedArray(MetalnessMapTextureName);
const ParallaxMapTexture = CreateNamedArray(ParallaxMapTextureName);
const MaskMapNames = MapCycle(TerrainColorDepth, k => MaskMapNamePreffix + k, true);
export const MapTileCoords = CreateNamedArray(MapTileCoordsName);
export const MaskNames = MapCycle(TerrainColorDepth, k => MaskTextureNamePreffix + k, true);

// Имена цветов
const ColorsNames: CustomObjectKey<MapTerrainSplatMapColor, string> = {
  [MapTerrainSplatMapColor.Red]: "r",
  [MapTerrainSplatMapColor.Green]: "g",
  [MapTerrainSplatMapColor.Blue]: "b",
  [MapTerrainSplatMapColor.Alpha]: "a"
};
const getMapVar: Function = (t: MapTerrain) => MaskMapNames[t.splatMap.layout];
const getMapVarColor: Function = (t: MapTerrain) => getMapVar(t) + "." + ColorsNames[t.splatMap.color];

// Униформы
export const TerrainUniforms: Uniforms = UniformsUtils.merge([BaseShader.uniforms, {
  // Координаты текстур
  ...MapTileCoords.reduce((o, name, k) => {
    const terrain: MapTerrain = MapTerrains[k];
    // Запомнить координаты
    return {
      ...o,
      [name]: ThreeVector2Uniform(terrain.tileCoords.x, terrain.tileCoords.y)
    };
  }, {}),
  // Повторы
  b_one_repeat: ThreeVector2Uniform(1),
  // Прочее
  tileSize: ThreeVector2Uniform(TerrainTileSize),
  tileSpacing: ThreeVector2Uniform(TerrainTileSpacing),
  tileSetSize: ThreeVector2Uniform(TerrainTileSetSize),
  normalScale: ThreeVector2Uniform(3),
  normalMapType: ThreeFloatUniform(ObjectSpaceNormalMap),
  aoMapIntensity: ThreeFloatUniform(1),
  roughness: ThreeFloatUniform(1),
  metalness: ThreeFloatUniform(1),
  lightMapIntensity: ThreeFloatUniform(0.05),
  fogNear: ThreeFloatUniform(DreamFogNear),
  fogFar: ThreeFloatUniform(DreamFogFar),
  parallaxScale: ThreeFloatUniform(ParallaxSize * (DreamCeilSize / DreamCeilParts))
}]);

// Вершинный шейдер
export const TerrainFragmentShader = `
  uniform vec2 tileSize;
  uniform vec2 tileSpacing;
  uniform vec2 tileSetSize;
  uniform vec2 mapRepeat;
  uniform vec2 ${MapTileCoords.join(", ")};
  uniform vec2 ${MapRepeats.join(", ")};

  uniform sampler2D ${MaskNames.join(", ")};
  uniform sampler2D ${MapTextureName};

  vec2 vec2LineFunc (vec2 min, vec2 max, vec2 v, vec2 vMin, vec2 vMax) {
    return (((v - vMin) / (vMax - vMin)) * (max - min)) + min;
  }

  vec4 getTileTexture (sampler2D texture, vec2 tileCoords, vec2 uv) {
    vec2 uvMin = vec2(0., 0.);
    vec2 uvMax = vec2(1., 1.);
    vec2 halfVec2 = vec2(.5, .5);
    vec2 doubleVec2 = vec2(2., 2.);
    vec2 tileMaxSize = tileSize - (tileSpacing * doubleVec2) - uvMax;
    vec2 allTiles = floor((tileSetSize / tileSize) + halfVec2) - uvMax;
    vec2 coords = vec2(tileCoords.x, allTiles.y - tileCoords.y);
    vec2 tilingUV = fract(uv * mapRepeat);
    vec2 offset = ((tileSize * coords) + tileSpacing) + (tileMaxSize * tilingUV);
    vec2 textureUV = fract(vec2LineFunc(uvMin, uvMax, offset, uvMin, tileSetSize));

    return texture2D(texture, textureUV);
  }

  vec4 lightMapTexelToLinear(vec4 texel) {
    return vec4(pow(texel.rgb, vec3(2.2)), texel.a);
  }

  vec4 invertColor(vec4 texel) {
    return vec4(1.0 - texel.r, 1.0 - texel.g, 1.0 - texel.b, texel.a);
  }

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
    // Удаление лишней закраски
    .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "")
    // ! Карта параллакса
    .replace("void main() {", `
      #if defined( USE_PARALLAXMAP )
        uniform sampler2D ${ParallaxMapTextureName};
        uniform float parallaxScale;
      #endif

      void main() {
        ${MaskMapNames.map((n, k) => `vec4 ${n} = texture2D(${MaskNames[k]}, vUv);`).join("\n")}

        float ior = 1.0;

        finalUv = vUv;

        #ifdef USE_PARALLAXMAP
          const int parallaxSteps = ${ParallaxSteps};

          float currentHeight = 0.0;
          float stepSize = parallaxScale / float(parallaxSteps);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          for(int i = 0; i < parallaxSteps; i++) {
            currentHeight += stepSize;

            vec2 newUv = vUv - (vec2(viewDir.x, -viewDir.z) * currentHeight);
            ${ParallaxMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${ParallaxMapTextureName}, ${MapTileCoords[k]}, newUv);`).join("\n")}
            float textureHeight = (${MapTerrains.map((t, k) => "(" + ParallaxMapTexture[k] + ".r * " + getMapVarColor(t) + ")").join(" + ")});

            if (textureHeight < currentHeight) {
              break;
            }
          }

          finalUv = vUv - (viewDir.xy * currentHeight);
        #endif
    `)
    // ! Текстурная карта
    .replace("#include <map_fragment>", `
      #ifdef USE_MAP
        ${MapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${MapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}
        vec4 texelColor = (${MapTerrains.map((t, k) => "(" + MapTexture[k] + " * " + getMapVarColor(t) + ")").join(" + ")});
        vec4 diffuseColor = LinearToLinear(texelColor);
      #endif
    `)
    // ! Карта металичности
    // Фрагмент 1
    .replace("#include <metalnessmap_pars_fragment>", `
      #ifdef USE_METALNESSMAP
        uniform sampler2D ${MetalnessMapTextureName};
      #endif
    `)
    // Фрагмент 2
    .replace("#include <metalnessmap_fragment>", `
      float metalnessFactor = metalness;
      #ifdef USE_METALNESSMAP
        ${MetalnessMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${MetalnessMapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}
        metalnessFactor *= ${MapTerrains.map((t, k) => "(" + MetalnessMapTexture[k] + ".g * " + getMapVarColor(t) + ")").join(" + ")};
      #endif
    `)
    // ! Карта шероховатости
    // Фрагмент 1
    .replace("#include <roughnessmap_pars_fragment>", `
      #if defined( USE_ROUGHNESSMAP )
        uniform sampler2D ${RoughnessMapTextureName};
      #endif
    `)
    // Фрагмент 2
    .replace("#include <roughnessmap_fragment>", `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        ${RoughnessMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${RoughnessMapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}
        roughnessFactor *= ${MapTerrains.map((t, k) => "(" + RoughnessMapTexture[k] + ".g * " + getMapVarColor(t) + ")").join(" + ")};
      #endif
    `)
    // ! Карта атмосферного свечения
    // Фрагмент 1
    .replace("#include <aomap_pars_fragment>", `
      #ifdef USE_AOMAP
        uniform float aoMapIntensity;
        uniform sampler2D ${AoMapTextureName};
      #endif
    `)
    // Фрагмент 2
    .replace("#include <aomap_fragment>", `
      #ifdef USE_AOMAP
        ${AoMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${AoMapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}
        float ambientOcclusion = (
          ${MapTerrains.map((t, k) => "(" + AoMapTexture[k] + ".r * " + getMapVarColor(t) + ")").join(" + ")}
        ) * aoMapIntensity;
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

          ${MaskMapNames.map((n, k) => `vec4 ${n} = texture2D(${MaskNames[k]}, finalUv);`).join("\n")}
          ${NormalMapTexture.map((n, k) => `vec4 ${n} = getTileTexture(${NormalMapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}

          vec4 full_normal = (
            ${MapTerrains.map((t, k) => "(" + NormalMapTexture[k] + " * " + getMapVarColor(t) + ")").join(" + ")}
          );

          vec3 mapN = full_normal.xyz * 2.0 - 1.0;
          mapN.xy = normalScale * mapN.xy;
          mat3 tsn = mat3(S, T, N);

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
    // ! Карта освещения
    // Фрагмент 1
    .replace("#include <lightmap_pars_fragment>", `
      uniform float lightMapIntensity;
      uniform sampler2D ${LightMapTextureName};
    `)
    // Фрагмент 2
    .replace("#include <lights_fragment_maps>", `
      #ifdef USE_LIGHTMAP
        ${LightMap.map((n, k) => `vec4 ${n} = getTileTexture(${LightMapTextureName}, ${MapTileCoords[k]}, finalUv);`).join("\n")}
        vec4 lightMapTexel = (${MapTerrains.map((t, k) => "(" + LightMap[k] + " * " + getMapVarColor(t) + ")").join(" + ")});
        vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
        reflectedLight.indirectDiffuse += lightMapIrradiance;
      #endif
    `)
  }
`;

// Фрагментный шейдер
export const TerrainVertexShader = BaseShader.vertexShader;
console.log(BaseShader.vertexShader);

// Настройки шейдера материала
export const TerrainDefines: CustomObject<boolean> = {
  USE_UV: true,
  USE_TRANSMISSION: true,
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
  FLAT_SHADED: false,
  USE_TANGENT: true,
  DOUBLE_SIDED: false,
  USE_CLEARCOAT: false,
  USE_FOG: true,
  FOG_EXP2: false,
  USE_SHEEN: false,
  USE_ENVMAP: false
}
