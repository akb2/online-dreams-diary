import { OnTexture3DProgress, TextureCache } from "@_models/three.js/base";
import { Observable, finalize, from, of, tap } from "rxjs";
import { Texture, TextureLoader } from "three";





// Кеш текстур
const TexturesCache: TextureCache[] = [];





// Загрузка текстуры
export const Load3DTexture = (url: string, onProgress?: OnTexture3DProgress): Observable<Texture> => {
  const textureCache: TextureCache = TexturesCache.find(({ url: testUrl }) => testUrl === url);
  // Вернуть из кеша
  if (!!textureCache) {
    return !!textureCache.loader
      ? textureCache.loader
      : of(textureCache.texture);
  }
  // Загрузить текстуру
  else {
    const newTextureCache: TextureCache = {
      url,
      loader: from(new TextureLoader().loadAsync(url, onProgress)).pipe(
        tap(texture => newTextureCache.texture = texture),
        finalize(() => newTextureCache.loader = null)
      )
    };
    // Добавить в массив
    TexturesCache.push(newTextureCache);
    // Загрузка
    return newTextureCache.loader;
  }
};
