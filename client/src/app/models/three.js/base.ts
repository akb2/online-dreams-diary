import { CustomObject } from "@_models/app";
import { IUniform, Shader, WebGLRenderer } from "three";





// Тип для униформ
export type Uniforms = CustomObject<IUniform<any>>;

// Тип функции компиляции шейдера
export type OnBeforeCompileCallback = (shader: Shader, renderer?: WebGLRenderer) => void;
