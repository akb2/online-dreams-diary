import { UniversalVector3, XYCoord } from "@_models/dream-map";
import { OnBeforeCompileCallback, ThreeUniform, ThreeUniformType } from "@_models/three.js/base";
import { round } from "@akb2/math";
import { Color, Material, Shader, Texture, Vector3, WebGLRenderer } from "three";





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

// Создание числовой униформы
export const ThreeIntUniform = (value: number): ThreeUniform<number> => ({ value: round(value), type: ThreeUniformType.int });

// Создание векторной (2) униформы
export const ThreeVector2Uniform = (...[x, y]: number[]): ThreeUniform<XYCoord> => {
  x = x ?? 0;
  y = y ?? x;
  // Униформа
  return { value: { x, y }, type: ThreeUniformType.vector2 };
};

/**
 * Создание векторной (3) униформы
 * @param {number | number[] | Vector3 | Color} data - Основное значение для униформы.
 * @param {number} dataY - Значение для компонента 'y' вектора, если первый аргумент - число.
 * @param {number} dataZ - Значение для компонента 'z' вектора, если первый аргумент - число.
 * @returns {ThreeUniform<UniversalVector3>} Объект униформы, содержащий значение и тип.
 */
export const ThreeVector3Uniform = (data?: number | number[] | Vector3 | Color, dataY?: number, dataZ?: number): ThreeUniform<UniversalVector3> => {
  let value: UniversalVector3 = {};
  // Проверка входных данных
  if (!!data) {
    if (typeof data === "number") {
      value.x = data ?? 0;
      value.y = dataY ?? value.x;
      value.z = dataZ ?? value.y;
    }
    // Получен массив чисел
    else if (Array.isArray(data)) {
      value.x = data[0] ?? 0;
      value.y = data[1] ?? value.x;
      value.z = data[2] ?? value.y;
    }
    // Вектор
    else if (data instanceof Vector3) {
      value.x = data.x ?? 0;
      value.y = data.y ?? value.x;
      value.z = data.z ?? value.y;
    }
    // Цвет
    else if (data instanceof Color) {
      value.r = data.r ?? 0;
      value.g = data.g ?? value.r;
      value.b = data.b ?? value.g;
    }
  }
  // Значения по умолчанию
  if (!value.hasOwnProperty("x") && !value.hasOwnProperty("r")) {
    value = { x: 0, y: 0, z: 0 };
  }
  // Униформа
  return { value, type: ThreeUniformType.vector3 };
};

// Создание текстурной униформы
export const ThreeTextureUniform = (value: Texture): ThreeUniform<Texture> => ({ value, type: ThreeUniformType.texture });
