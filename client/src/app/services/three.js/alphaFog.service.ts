import { AddMaterialBeforeCompile } from "@_threejs/base";
import { Injectable } from "@angular/core";
import { Material, Shader, ShaderMaterial } from "three";





@Injectable({
  providedIn: "root"
})

export class DreamMapAlphaFogService {


  // Преобразовать туман материала в прозрачный
  getMaterial(material: Material): Material {
    AddMaterialBeforeCompile(material, (shader: Shader) => {
      shader.vertexShader = FogVertexShader(shader.vertexShader);
      shader.fragmentShader = FogFragmentShader(shader.fragmentShader);
      // Настройки
      material.userData.shader = shader;
      material.transparent = true;
    });
    // Преобразованный материал
    return material;
  }

  // Преобразование шейдерного материала
  getShaderMaterial(material: ShaderMaterial): ShaderMaterial {
    material.vertexShader = FogVertexShader(material.vertexShader);
    material.fragmentShader = FogFragmentShader(material.fragmentShader);
    material.transparent = true;
    // Преобразованный материал
    return material;
  }

  // Замена шейдерных функций
  getShader(shader: Shader): Shader {
    shader.vertexShader = FogVertexShader(shader.vertexShader);
    shader.fragmentShader = FogFragmentShader(shader.fragmentShader);
    // Вернуть шейдер
    return shader;
  }
}





// Шейдер тумана
export const FogVertexShader = (shader: string) => {
  shader = shader.replace("#include <fog_pars_vertex>", `
    #include <fog_pars_vertex>
  `);
  // Тело
  shader = shader.replace("#include <fog_vertex>", `
    #include <fog_vertex>
  `);
  // Обновленный шейдер
  return shader;
};

// Шейдер тумана
export const FogFragmentShader = (shader: string) => {
  shader = shader.replace("#include <fog_pars_fragment>", `
    #include <fog_pars_fragment>
  `);
  // Тело
  shader = shader.replace("#include <fog_fragment>", `
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
      #else
        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
      #endif

      gl_FragColor.a = saturate(gl_FragColor.a - fogFactor);
    #endif
  `);
  // Обновленный шейдер
  return shader;
};
