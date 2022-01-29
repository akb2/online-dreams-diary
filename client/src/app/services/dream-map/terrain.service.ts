import { Injectable } from "@angular/core";
import { MapTerrain, TerrainMaterialCache, TerrainTextureCache } from "@_models/dream-map";
import { BackSide, BufferAttribute, BufferGeometry, Mesh, MeshPhongMaterial, Texture, TextureLoader, Vector3 } from "three";





@Injectable({ providedIn: "root" })

export class TerrainService {


  private path: string = "../../assets/dream-map/terrain/";
  private textureCache: TerrainTextureCache[] = [];
  private materialCache: TerrainMaterialCache[] = [];





  // Объект для отрисовки
  getObject(terrainId: number, size: number, height: number, closestHeights: ClosestHeights): Mesh {
    const geometry: BufferGeometry = this.getGeometry(size, height, closestHeights);
    const material = this.getMaterial(terrainId);
    const mesh: Mesh = new Mesh(geometry, material);
    // Настройки
    geometry.computeVertexNormals();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Вернуть объект
    return mesh;
  }

  // Геометрия
  getGeometry(size: number, height: number, closestHeights: ClosestHeights): BufferGeometry {
    // Смещения
    const shiftH: number = size / 2;
    const heightL: number = this.getHeightSidePos(height, closestHeights.left);
    const heightR: number = this.getHeightSidePos(height, closestHeights.right);
    const heightT: number = this.getHeightSidePos(height, closestHeights.top);
    const heightB: number = this.getHeightSidePos(height, closestHeights.bottom);
    const heightTL: number = this.getHeightAnglePos(height, closestHeights.top, closestHeights.left, closestHeights.topLeft);
    const heightTR: number = this.getHeightAnglePos(height, closestHeights.top, closestHeights.right, closestHeights.topRight);
    const heightBL: number = this.getHeightAnglePos(height, closestHeights.bottom, closestHeights.left, closestHeights.bottomLeft);
    const heightBR: number = this.getHeightAnglePos(height, closestHeights.bottom, closestHeights.right, closestHeights.bottomRight);
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
  getMaterial(terrainId: number): MeshPhongMaterial {
    const findCache: (m: TerrainMaterialCache) => boolean = m => m.terrain === terrainId;
    // Материал из кэша
    if (this.materialCache.some(findCache)) {
      return new MeshPhongMaterial().copy(this.materialCache.find(findCache).material);
    }
    // Новый материал
    else {
      const map: Texture = this.getTexture(terrainId);
      const material: MeshPhongMaterial = new MeshPhongMaterial({ map, side: BackSide });
      // Сохранить в кэш
      this.materialCache.push({ side: BackSide, material, terrain: terrainId });
      // Вернуть материал
      return material;
    }
  }




  // Получить данные о типе местности
  getTerrain(terrainId: number): MapTerrain {
    return MapTerrains.find(t => t.id === terrainId) || MapTerrains[0];
  }

  // Получение текстуры
  private getTexture(terrainId: number): Texture {
    const findCache: (t: TerrainTextureCache) => boolean = t => t.terrain === terrainId;
    // Текстура из кэша
    if (this.textureCache.some(findCache)) {
      const texture: Texture = this.textureCache.find(findCache).texture;
      // Вернуть текстуру
      return texture;
    }
    // Новая текстура
    else {
      const textureFile: string = this.path + "top/" + this.getTerrain(terrainId).name + ".jpg";
      const texture: Texture = new TextureLoader().load(textureFile);
      // Сохранить в кэш
      this.textureCache.push({ texture, terrain: terrainId });
      // Вернуть текстуру
      return texture;
    }
  }

  // Пересчитать разницу в высоте: соседние точки
  private getHeightSidePos(h: number, h1: ClosestHeight): number {
    return h - ((h - h1.height) / 2);
  }

  // Пересчитать разницу в высоте: угловые точки
  private getHeightAnglePos(h: number, h1: ClosestHeight, h2: ClosestHeight, h3: ClosestHeight): number {
    return (h + h1.height + h2.height + h3.height) / 4;
  }
}





// Интерфейс соседних блоков
export interface ClosestHeights {
  top: ClosestHeight;
  left: ClosestHeight;
  right: ClosestHeight;
  bottom: ClosestHeight;
  topLeft: ClosestHeight;
  topRight: ClosestHeight;
  bottomLeft: ClosestHeight;
  bottomRight: ClosestHeight;
}

// Интерфейс для соседних блоков
export interface ClosestHeight {
  height: number;
  terrain: number;
}

// Интерфейс для соседних блоков
export interface ClosestHeightAligment {
  height: number;
}





// Список типов местности
export const MapTerrains: MapTerrain[] = [{
  id: 1,
  name: "grass",
  title: "Газон",
  isAvail: true
}, {
  id: 2,
  name: "dirty",
  title: "Земля",
  isAvail: true
}, {
  id: 3,
  name: "rock",
  title: "Камень",
  isAvail: true
}, {
  id: 4,
  name: "sand",
  title: "Песок",
  isAvail: true
}];