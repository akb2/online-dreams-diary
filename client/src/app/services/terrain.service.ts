import { Injectable } from "@angular/core";
import { MapTerrain } from "@_models/dream-map";
import { BackSide, BufferAttribute, BufferGeometry, Mesh, MeshPhongMaterial, Texture, TextureLoader, Vector3 } from "three";





@Injectable({ providedIn: "root" })

export class TerrainService {


  private path: string = "../../assets/dream-map/terrain/";
  private textureCache: TextureCache[] = [];
  private materialCache: MaterialCache[] = [];





  // Объект для отрисовки
  getObject(id: number, size: number, height: number, closestHeights: ClosestHeights, afterTextureLoad: AfterTextureLoad): Mesh {
    const geometry: BufferGeometry = this.geometry(size, height, closestHeights);
    const material = this.getMaterial(id, geometry, afterTextureLoad);
    const mesh: Mesh = new Mesh(geometry, material);
    // Настройки
    geometry.computeVertexNormals();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Вернуть объект
    return mesh;
  }

  // Геометрия
  geometry(size: number, height: number, closestHeights: ClosestHeights): BufferGeometry {
    // Смещения
    const shiftH: number = size / 2;
    const heightL: number = this.heightSidePos(height, closestHeights.left);
    const heightR: number = this.heightSidePos(height, closestHeights.right);
    const heightT: number = this.heightSidePos(height, closestHeights.top);
    const heightB: number = this.heightSidePos(height, closestHeights.bottom);
    const heightTL: number = this.heightAnglePos(height, closestHeights.top, closestHeights.left, closestHeights.topLeft);
    const heightTR: number = this.heightAnglePos(height, closestHeights.top, closestHeights.right, closestHeights.topRight);
    const heightBL: number = this.heightAnglePos(height, closestHeights.bottom, closestHeights.left, closestHeights.bottomLeft);
    const heightBR: number = this.heightAnglePos(height, closestHeights.bottom, closestHeights.right, closestHeights.bottomRight);
    // Верхние точки
    // 1 - 2 - 3
    // | \ | / |
    // 4 - 5 - 6
    // | / | \ |
    // 7 - 8 - 9
    const t1: Vector3 = new Vector3(-shiftH, heightTL, -shiftH);
    const t2: Vector3 = new Vector3(0, heightT, -shiftH);
    const t3: Vector3 = new Vector3(shiftH, heightTR, -shiftH);
    const t4: Vector3 = new Vector3(-shiftH, heightL, 0);
    const t5: Vector3 = new Vector3(0, height, 0);
    const t6: Vector3 = new Vector3(shiftH, heightR, 0);
    const t7: Vector3 = new Vector3(-shiftH, heightBL, shiftH);
    const t8: Vector3 = new Vector3(0, heightB, shiftH);
    const t9: Vector3 = new Vector3(shiftH, heightBR, shiftH);
    // Точки текстурирования
    const tt1: [number, number] = [0, 1];
    const tt2: [number, number] = [0.5, 1];
    const tt3: [number, number] = [1, 1];
    const tt4: [number, number] = [0, 0.5];
    const tt5: [number, number] = [0.5, 0.5];
    const tt6: [number, number] = [1, 0.5];
    const tt7: [number, number] = [0, 0];
    const tt8: [number, number] = [0.5, 0];
    const tt9: [number, number] = [1, 0];
    // Геометрия
    const points: Vector3[] = [
      // Верхняя грань
      t5, t1, t2,
      t5, t2, t3,
      t5, t3, t6,
      t5, t6, t9,
      t5, t9, t8,
      t5, t8, t7,
      t5, t7, t4,
      t5, t4, t1,
    ];
    // Геометрия текстур
    const uvMap: Float32Array = new Float32Array([
      // Верхняя грань
      ...tt5, ...tt1, ...tt2,
      ...tt5, ...tt2, ...tt3,
      ...tt5, ...tt3, ...tt6,
      ...tt5, ...tt6, ...tt9,
      ...tt5, ...tt9, ...tt8,
      ...tt5, ...tt8, ...tt7,
      ...tt5, ...tt7, ...tt4,
      ...tt5, ...tt4, ...tt1,
    ]);
    // Геометрия
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(points);
    // Настройки
    geometry.setAttribute("uv", new BufferAttribute(uvMap, 2));
    // Вернуть геометрию
    return geometry;
  }

  // Материалы
  private getMaterial(terrainId: number, geometry: BufferGeometry, afterTextureLoad: AfterTextureLoad): MeshPhongMaterial {
    const findCache: (m: MaterialCache) => boolean = m => m.terrain === terrainId;
    // Материал из кэша
    if (this.materialCache.some(findCache)) {
      return new MeshPhongMaterial().copy(this.materialCache.find(findCache).material);
    }
    // Новый материал
    else {
      const map: Texture = this.getTexture(
        terrainId,
        geometry,
        (geometry: BufferGeometry, terrain: number, texture: Texture) => afterTextureLoad(geometry, terrain, texture)
      );
      const material: MeshPhongMaterial = new MeshPhongMaterial({ map, side: BackSide });
      // Сохранить в кэш
      this.materialCache.push({ material, terrain: terrainId });
      // Вернуть материал
      return material;
    }
  }

  // Получение текстуры
  private getTexture(terrainId: number, geometry: BufferGeometry, afterTextureLoad: AfterTextureLoad): Texture {
    const findCache: (t: TextureCache) => boolean = t => t.terrain === terrainId;
    // Текстура из кэша
    if (this.textureCache.some(findCache)) {
      const texture: Texture = this.textureCache.find(findCache).texture;
      // Функция обратного вызова после загрузки текстуры
      afterTextureLoad(geometry, terrainId, texture);
      // Вернуть текстуру
      return texture;
    }
    // Новая текстура
    else {
      const terrain: MapTerrain = MapTerrains.find(t => t.id === terrainId) || MapTerrains[0];
      const textureFile: string = this.path + "top/" + terrain.name + ".jpg";
      const texture: Texture = new TextureLoader().load(textureFile, t => afterTextureLoad(geometry, terrainId, t));
      // Сохранить в кэш
      this.textureCache.push({ texture, terrain: terrainId });
      // Вернуть текстуру
      return texture;
    }
  }

  // Пересчитать разницу в высоте
  private heightSidePos(h1: number, h2: number | null): number {
    return h1 - (h2 === null ? 0 : (h1 - h2) / 2);
  }

  // Пересчитать разницу в высоте
  private heightAnglePos(h1: number, h2: number | null, h3: number | null, h4: number | null): number {
    return h2 === null || h3 === null || h4 === null ? 0 : (h1 + h2 + h3 + h4) / 4;
  }
}





// Список небес
export const MapTerrains: MapTerrain[] = [{
  id: 1,
  name: "grass",
  title: "Газон"
}, {
  id: 2,
  name: "rock",
  title: "Камень"
}];

// Интерфейс кэша текстур
interface TextureCache {
  terrain: number;
  texture: Texture;
}

// Интерфейс кэша материалов
interface MaterialCache {
  terrain: number;
  material: MeshPhongMaterial;
}

// Интерфейс соседних блоков
export interface ClosestHeights {
  top: number | null;
  left: number | null;
  right: number | null;
  bottom: number | null;
  topLeft: number | null;
  topRight: number | null;
  bottomLeft: number | null;
  bottomRight: number | null;
}

// Тип обратной функции после загрузки текстур
export type AfterTextureLoad = (geometry: BufferGeometry, terrain: number, texture: Texture) => void;