import { Injectable } from "@angular/core";
import { CustomObjectKey } from "@_models/app";
import { MapTerrain, TerrainMaterialCache, TerrainTextureCache, TextureType } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";
import { BackSide, BufferAttribute, BufferGeometry, Color, DoubleSide, FrontSide, Mesh, MeshStandardMaterial, PlaneGeometry, Texture, TextureLoader, Vector2, Vector3 } from "three";





@Injectable({ providedIn: "root" })

export class TerrainService {


  private path: string = "../../assets/dream-map/terrain/";
  private textureCache: TerrainTextureCache[] = [];
  materialCache: TerrainMaterialCache[] = [];





  // Объект для отрисовки
  getObject(terrainId: number, size: number, height: number, closestHeights: ClosestHeights, afterTextureLoad: (texture: Texture) => void = () => { }): TerrainDrawData {
    const land: Mesh = new Mesh(this.getGeometry(size, height, closestHeights), this.getMaterial(terrainId, true, afterTextureLoad));
    // Настройки
    land.geometry.computeVertexNormals();
    land.castShadow = true;
    land.receiveShadow = true;
    // Вернуть объект
    return { land };
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
    geometry.setAttribute("uv2", new BufferAttribute(uvMap, 2));
    // Вернуть геометрию
    return geometry;
  }

  // Материалы
  getMaterial(terrainId: number, useCache: boolean = true, afterTextureLoad: (texture: Texture) => void = () => { }): MeshStandardMaterial {
    const findCache: (m: TerrainMaterialCache) => boolean = m => m.terrain === terrainId;
    const terrain: MapTerrain = this.getTerrain(terrainId);
    // Материал из кэша
    if (this.materialCache.some(findCache) && useCache) {
      return new MeshStandardMaterial().copy(this.materialCache.find(findCache).material);
    }
    // Новый материал
    else {
      const map: Texture = this.getTexture(terrainId, "face", useCache, afterTextureLoad);
      const aoMap: Texture = this.getTexture(terrainId, "ao", useCache, afterTextureLoad);
      const normalMap: Texture = this.getTexture(terrainId, "normal", useCache, afterTextureLoad);
      const displacementMap: Texture = this.getTexture(terrainId, "disp", useCache, afterTextureLoad);
      const material: MeshStandardMaterial = new MeshStandardMaterial({
        ...Object
          .entries(terrain.settings)
          .filter(([k]) => k !== "colorR" && k !== "colorG" && k !== "colorB")
          .map(([k, v]) => k === "normalScale" ? [k, new Vector2(1, -1)] : [k, v])
          .reduce((o, [k, v]) => ({ ...o, [k as string]: v }), {}),
        color: new Color(
          terrain.settings.colorR / 255,
          terrain.settings.colorG / 255,
          terrain.settings.colorB / 255
        ),
        side: BackSide,
        map,
        aoMap,
        normalMap,
        displacementMap,
      });
      // Настройки
      material.normalScale.set(1, - 1).multiplyScalar(terrain.settings.normalScale);
      // Сохранить в кэш
      if (useCache) {
        this.materialCache.push({ side: BackSide, material, terrain: terrainId });
      }
      // Вернуть материал
      return material;
    }
  }




  // Получить данные о типе местности
  getTerrain(terrainId: number): MapTerrain {
    return MapTerrains.find(t => t.id === terrainId) ?? MapTerrains[0];
  }

  // Получение текстуры
  private getTexture(terrainId: number, type: TextureType = "face", useCache: boolean = true, afterTextureLoad: (texture: Texture) => void = () => { }): Texture {
    const findCache: (t: TerrainTextureCache) => boolean = t => t.terrain === terrainId;
    let texture: Texture;
    let aoTexture: Texture;
    let dispTexture: Texture;
    let normalTexture: Texture;
    // Текстура из кэша
    if (this.textureCache.some(findCache) && useCache) {
      const cache: TerrainTextureCache = this.textureCache.find(findCache)!;
      texture = cache.texture;
      aoTexture = cache.aoTexture;
      dispTexture = cache.dispTexture;
      normalTexture = cache.normalTexture;
    }
    // Новая текстура
    else {
      const terrain: MapTerrain = this.getTerrain(terrainId);
      const textureFile: string = this.path + "top/face/" + terrain.name + "." + terrain.exts.face;
      const aoTextureFile: string = this.path + "top/ao/" + terrain.name + "." + terrain.exts.ao;
      const dispTextureFile: string = this.path + "top/displacement/" + terrain.name + "." + terrain.exts.disp;
      const normalTextureFile: string = this.path + "top/normal/" + terrain.name + "." + terrain.exts.normal;
      // Результаты
      texture = new TextureLoader().load(textureFile, afterTextureLoad);
      aoTexture = new TextureLoader().load(aoTextureFile, afterTextureLoad);
      dispTexture = new TextureLoader().load(dispTextureFile, afterTextureLoad);
      normalTexture = new TextureLoader().load(normalTextureFile, afterTextureLoad);
      // Сохранить в кэш
      if (useCache) {
        this.textureCache.push({
          texture,
          aoTexture,
          dispTexture,
          normalTexture,
          terrain: terrainId
        });
      }
    }
    // Массив текстур
    const textures: CustomObjectKey<TextureType, Texture> = {
      normal: normalTexture,
      disp: dispTexture,
      face: texture,
      ao: aoTexture
    };
    // Вернуть текстуру
    return textures[type] ? textures[type] : textures.face;
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

// Интерфейс выходных данных
export interface TerrainDrawData {
  land: Mesh;
}





// Список типов местности
export const MapTerrains: MapTerrain[] = [
  // Газон
  {
    id: 1,
    name: "grass",
    title: "Газон",
    settings: {
      colorR: 115,
      colorG: 201,
      colorB: 44,
      metalness: 0,
      roughness: 0.76,
      aoMapIntensity: 2.5,
      normalScale: -0.2
    }
  },
  // Земля
  {
    id: 2,
    name: "dirt",
    title: "Земля",
    settings: {
      colorR: 135,
      colorG: 163,
      colorB: 158,
      metalness: 0.1,
      roughness: 0.85,
      aoMapIntensity: 5.5,
      normalScale: -0.2
    }
  },
  // Камень
  {
    id: 3,
    name: "stone",
    title: "Камень",
    settings: {
      colorR: 180,
      colorG: 180,
      colorB: 180,
      metalness: 0.75,
      roughness: 0.75,
      aoMapIntensity: 2.5,
      normalScale: -0.7
    }
  },
  // Песок
  {
    id: 4,
    name: "sand",
    title: "Песок",
    settings: {
      colorR: 170,
      colorG: 170,
      colorB: 170,
      metalness: 0.1,
      roughness: 0.6,
      aoMapIntensity: 3.5,
      normalScale: -0.5
    }
  },
  // Снег
  {
    id: 5,
    name: "snow",
    title: "Снег",
    settings: {
      colorR: 230,
      colorG: 230,
      colorB: 230,
      metalness: 0,
      roughness: 0.4,
      aoMapIntensity: 0.5,
      normalScale: 0.1
    }
  }
]
  .map(d => d as MapTerrain)
  .map(d => ({
    ...d,
    isAvail: !!d?.isAvail || true,
    exts: {
      face: d?.exts?.face as ImageExtension ?? ImageExtension.png,
      disp: d?.exts?.disp as ImageExtension ?? ImageExtension.png,
      normal: d?.exts?.normal as ImageExtension ?? ImageExtension.png,
      ao: d?.exts?.ao as ImageExtension ?? ImageExtension.png
    },
    settings: {
      colorR: d?.settings?.colorR === undefined ? 100 : d.settings.colorR,
      colorG: d?.settings?.colorG === undefined ? 100 : d.settings.colorG,
      colorB: d?.settings?.colorB === undefined ? 100 : d.settings.colorB,
      metalness: d?.settings?.metalness === undefined ? 0.5 : d.settings.metalness,
      roughness: d?.settings?.roughness === undefined ? 0 : d.settings.roughness,
      aoMapIntensity: d?.settings?.aoMapIntensity === undefined ? 1 : d.settings.aoMapIntensity,
      displacementScale: d?.settings?.displacementScale === undefined ? 0 : d.settings.displacementScale,
      envMapIntensity: d?.settings?.envMapIntensity === undefined ? 1 : d.settings.envMapIntensity,
      normalScale: d?.settings?.normalScale === undefined ? 0 : d.settings.normalScale,
    }
  }));
