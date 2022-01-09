import { Injectable } from "@angular/core";
import { MapTerrain } from "@_models/dream";
import { BufferGeometry, DoubleSide, Mesh, MeshPhongMaterial, Vector3 } from "three";





@Injectable({ providedIn: "root" })

export class TerrainService {


  private path: string = "../../assets/dream-map/terrain/";
  private sides: string[] = ["side", "side", "top", "", "side", "side"];
  private textureCache: TextureCache[] = [];





  // Объект для отрисовки
  getObject(id: number, size: number, height: number, closestHeights: ClosestHeights): Mesh {
    const terrain: MapTerrain = MapTerrains.find(t => t.id === id) || MapTerrains[0];
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
    // Нижние точки
    // 1 --- 2
    // |  \  |
    // 3 --- 4
    const b1: Vector3 = new Vector3(-shiftH, 0, -shiftH);
    const b2: Vector3 = new Vector3(shiftH, 0, -shiftH);
    const b3: Vector3 = new Vector3(-shiftH, 0, shiftH);
    const b4: Vector3 = new Vector3(shiftH, 0, shiftH);
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
      // Верхняя грань
      t1, t2, b1,
      t2, t3, b2,
      t2, b1, b2,
      // Правая грань
      t3, t6, b2,
      t6, t9, b4,
      t6, b2, b4,
      // Нижняя грань
      t7, t8, b3,
      t8, t9, b4,
      t8, b3, b4,
      // Левая грань
      t1, t4, b1,
      t4, t7, b3,
      t4, b1, b3,
    ];
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(points);
    geometry.computeVertexNormals();
    // Фигура
    const mesh: Mesh = new Mesh(geometry, new MeshPhongMaterial({ color: 0xaaaaaa, side: DoubleSide }));
    // Настройки
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Вернуть объект
    return mesh;
  }

  // Пересчитать разницу в высоте
  private heightSidePos(h1: number, h2: number | null): number {
    return h1 - (h2 === null ? 0 : (h1 - h2) / 2);
  }

  // Пересчитать разницу в высоте
  private heightAnglePos(h1: number, h2: number | null, h3: number | null, h4: number | null): number {
    return h2 === null || h3 === null || h4 === null ? 0 : (h1 + h2 + h3 + h4) / 4;
  }

  /*
  getObject(id: number, size: number, height: number): Mesh {
    const terrain: MapTerrain = MapTerrains.find(t => t.id === id) || MapTerrains[0];
    // Текстуры
    let textures: MeshPhongMaterial[] = [];
    // Цикл по сторонам
    textures = this.sides.map(s => {
      // Определить показывать текстуру или нет
      let side: string = s;
      const h: number = side === "top" ? 0 : height;
      const findCache: (t: TextureCache) => boolean = t => t.side === side && t.terrain === terrain.id && t.height === h;
      // Материал из кэша
      if (this.textureCache.some(findCache)) {
        return this.textureCache.find(findCache).texture;
      }
      // Новый материал
      else {
        const name: string = side === "top" ? terrain.name : (terrain.useDefaultSide ? "default" : terrain.name);
        const map: Texture | null = side.length > 0 ? new TextureLoader().load(this.path + side + "/" + name + ".jpg") : null;
        const color: number = side.length > 0 ? null : (terrain.colors[s] ? terrain.colors[s] : 0x999999);
        // Настройка текстуры
        if (map) {
          map.offset.set(0, 0);
          map.wrapS = RepeatWrapping;
          map.wrapT = RepeatWrapping;
          if (side === "top") map.repeat.set(1, 1);
          else if (side === "side") map.repeat.set(1, height / size);
        }
        // Текстура
        const texture = new MeshPhongMaterial({ color, map, side: FrontSide });
        // Сохранить в кэш
        this.textureCache.push({ texture, side, height: h, terrain: terrain.id });
        // Вернуть текстуру
        return texture;
      }
    });
    // Объект
    const boxGeometry: BoxGeometry = new BoxGeometry(size, height, size);
    const mesh: Mesh = new Mesh(boxGeometry, textures);
    // Настройки
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Вернуть объект
    return mesh;
  }
  */
}





// Список небес
export const MapTerrains: MapTerrain[] = [{
  id: 1,
  name: "grass",
  title: "Газон",
  useDefaultSide: true,
  colors: {
    top: 0x677B2F,
    side: 0x766B61
  }
}, {
  id: 2,
  name: "rock",
  title: "Камень",
  useDefaultSide: true,
  colors: {
    top: 0x766B61,
    side: 0x766B61
  }
}];

// Интерфейс кэша текстур
interface TextureCache {
  terrain: number;
  side: string;
  height: number;
  texture: MeshPhongMaterial;
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