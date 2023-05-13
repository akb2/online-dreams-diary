import { OnBeforeCompileCallback } from "@_models/three.js/base";
import { Material, Shader, WebGLRenderer } from "three";





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
