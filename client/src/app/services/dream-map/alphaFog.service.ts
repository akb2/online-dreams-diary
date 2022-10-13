import { Injectable } from "@angular/core";
import { Material, Shader, ShaderMaterial } from "three";





@Injectable({
  providedIn: "root"
})

export class DreamMapAlphaFogService {


  // Преобразовать туман материала в прозрачный
  getMaterial(material: Material): Material {
    // Добавление шейдера
    material.onBeforeCompile = (shader: Shader) => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <fog_fragment>", FogFragmentShader);
      // Настройки
      material.userData.shader = shader;
      material.transparent = true;
    };
    // Преобразованный материал
    return material;
  }

  // Преобразование шейдерного материала
  getShaderMaterial(material: ShaderMaterial): ShaderMaterial {
    material.fragmentShader = material.fragmentShader.replace("#include <fog_fragment>", FogFragmentShader);
    material.transparent = true;
    // Преобразованный материал
    return material;
  }
}





// Шейдер тумана
const FogFragmentShader: string = `
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
    #else
      float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    #endif
    gl_FragColor.a = saturate(1.0 - fogFactor);
  #endif
`;
