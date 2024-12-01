import { Shader } from "three";

export const WorldOceanFogShader = (shader: Shader) => shader.fragmentShader = shader.fragmentShader.replace(
  "#include <fog_fragment>",
  `
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
      #else
        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
      #endif

      gl_FragColor.a = saturate(gl_FragColor.a - fogFactor);
    #endif
  `
);
