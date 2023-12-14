import { CustomObject } from "@_models/app";
import { Observable } from "rxjs";
import { IUniform, PerspectiveCamera, Scene, Shader, Texture, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";





// Тип данных униформы
export enum ThreeUniformType {
  float = "f",
  int = "i",
  vector2 = "v2",
  vector3 = "v3",
  texture = "t"
}

// Униформа
export interface ThreeUniform<T = any> extends IUniform<T> {
  type: ThreeUniformType;
}

// Тип для униформ
export type Uniforms = CustomObject<ThreeUniform<any>>;

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

// Данные для функций анимации
export interface AnimationData {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  control: OrbitControls;
}
