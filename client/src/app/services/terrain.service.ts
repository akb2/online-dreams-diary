import { Injectable } from "@angular/core";
import { MapTerrain } from "@_models/dream";
import { BoxGeometry, FrontSide, Mesh, MeshPhongMaterial, RepeatWrapping, Texture, TextureLoader } from "three";





@Injectable({ providedIn: "root" })

export class TerrainService {


  private path: string = "../../assets/dream-map/terrain/";
  private sides: string[] = ["side", "side", "top", "", "side", "side"];
  private textureCache: TextureCache[] = [];





  // Объект для отрисовки
  getObject(id: number, size: number, height: number): Mesh {
    const terrain: MapTerrain = MapTerrains.find(t => t.id === id) || MapTerrains[0];
    // Текстуры
    let textures: MeshPhongMaterial[] = [];
    // Из кэша
    if (this.textureCache.some(t => t.terrain === terrain.id && t.height === height)) {
      textures = this.textureCache.find(t => t.terrain === terrain.id)!.textures;
    }
    // Загрузить
    else {
      textures = this.sides.map((s, k) => {
        // Определить показывать текстуру или нет
        let side: string = s;
        // Имя текстуры
        const name: string = side === "top" ? terrain.name : (terrain.useDefaultSide ? "default" : terrain.name);
        const map: Texture | null = side.length > 0 ? new TextureLoader().load(this.path + side + "/" + name + ".jpg") : null;
        const color: number = side.length > 0 ? null : (terrain.colors[s] ? terrain.colors[s] : 0x999999);
        // Настройка текстуры
        if (map) {
          map.offset.set(0, 0);
          map.wrapS = RepeatWrapping;
          map.wrapT = RepeatWrapping;
          if (side === "top") map.repeat.set(1, 1);
          if (side === "side") {
            console.log(1, height / size, height, size);
            map.repeat.set(1, height / size);
          }
        }
        // Объект
        return new MeshPhongMaterial({ color, map, side: FrontSide });
      });
      // Сохранить в кэш
      this.textureCache.push({ textures, height, terrain: terrain.id });
    }
    // Объект
    const boxGeometry: BoxGeometry = new BoxGeometry(size, height, size);
    const mesh: Mesh = new Mesh(boxGeometry, textures);
    // Настройки
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Вернуть объект
    return mesh;
  }
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
  height: number;
  textures: MeshPhongMaterial[];
}

// Интерфейс соседних блоков
interface ClosestHeights {
  top: number | null;
  left: number | null;
  right: number | null;
  bottom: number | null;
}