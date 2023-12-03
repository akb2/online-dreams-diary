import { XYCoord } from "@_models/dream-map";
import { OnBeforeCompileCallback, ThreeUniform, ThreeUniformType } from "@_models/three.js/base";
import { Material, Shader, Texture, WebGLRenderer } from "three";





// Добавить код для компиляции шейдера
export const AddMaterialBeforeCompile = (material: Material, callback: OnBeforeCompileCallback) => {
  const onBeforeCompile: OnBeforeCompileCallback = material?.onBeforeCompile;
  // Добавление шейдера
  material.onBeforeCompile = (shader: Shader, renderer: WebGLRenderer) => {
    if (!!onBeforeCompile && typeof onBeforeCompile === "function") {
      onBeforeCompile(shader, renderer);
    }
    // Новый обработчик
    callback(shader, renderer);
  };
  // Обновить
  material.needsUpdate = true;
};

// Создание числовой униформы
export const ThreeFloatUniform = (value: number): ThreeUniform<number> => ({ value, type: ThreeUniformType.float });

// Создание векторной (2) униформы
export const ThreeVector2Uniform = (...[x, y]: number[]): ThreeUniform<XYCoord> => {
  x = x ?? 0;
  y = y ?? x;
  // Униформа
  return { value: { x, y }, type: ThreeUniformType.vector2 };
};

// Создание текстурной униформы
export const ThreeTextureUniform = (value: Texture): ThreeUniform<Texture> => ({ value, type: ThreeUniformType.texture });
