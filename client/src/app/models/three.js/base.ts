import { CustomObject } from "@_models/app";
import { Observable } from "rxjs";
import { IUniform, Shader, Texture, WebGLRenderer } from "three";





// Тип для униформ
export type Uniforms = CustomObject<IUniform<any>>;

// Тип функции компиляции шейдера
export type OnBeforeCompileCallback = (shader: Shader, renderer?: WebGLRenderer) => void;

// Интерфейс кеша текстур
export interface TextureCache {
  url: string;
  texture?: Texture;
  loader?: Observable<Texture>
}

// Интерфейс процесса загрузки
interface ProgressEvent {
  readonly loaded: number;
  readonly total: number;
}

// Интерфейс загрузки текстур
export interface LoadTexture {
  url: string;
  loaded: boolean;
  size: number;
  loadedSize: number;
  afterLoadEvent?: (texture: Texture) => void;
}

// Функция прогресса загрузки текстуры
export type OnTexture3DProgress = (event: ProgressEvent) => void;
