import { MapTerrain, TerrainMaterialCache, TerrainTextureCache } from "@_models/dream-map";
import { BackSide, DoubleSide, FrontSide, Group, MeshPhongMaterial, RepeatWrapping, Side, Texture, TextureLoader } from "three";





// Обобщающий класс дорог
export class Road {


  ceils: number;
  ceilSizeX: number;
  length: number;
  angle: number;

  roadHeight: number;

  startY: number;

  private path: string = "../../assets/dream-map/terrain/";





  // Углы в радианы
  angleToRad(angle: number): number {
    return angle * (Math.PI / 180);
  }

  // Радианы в углы
  radToAngle(rad: number): number {
    return rad * (180 / Math.PI);
  }

  // Синус от угла в градусах
  sin(angle: number): number {
    return Math.sin(this.angleToRad(angle));
  }

  // Косинус от угла в градусах
  cos(angle: number): number {
    return Math.cos(this.angleToRad(angle));
  }





  constructor(
    public ceilSizeY: number,
    public sX: number,
    public sY: number,
    public eX: number,
    public eY: number,
    public textureCache: TerrainTextureCache[] = [],
    public materialCache: TerrainMaterialCache[] = []
  ) {
    const sizeX: number = (this.eX - this.sX) * this.ceilSizeY;
    const sizeY: number = (this.eY - this.sY) * this.ceilSizeY;
    // Настройки класса
    this.angle = (Math.atan2(this.eY - this.sY, this.eX - this.sX) * 180) / Math.PI;
    this.length = Math.sqrt(Math.pow(sizeX, 2) + Math.pow(sizeY, 2)) + this.ceilSizeY;
    this.ceils = Math.floor(this.length / this.ceilSizeY);
    this.ceilSizeX = this.length / this.ceils;
    this.roadHeight = this.ceilSizeY / 20;
    this.startY = this.ceilSizeY / 500;
  }





  // Вернуть группу моделей
  getObject(): Group {
    return new Group();
  }





  // Получить данные о типе местности
  private getTerrain(terrainId: number): MapTerrain {
    return RoadTerrains.find(t => t.id === terrainId) || RoadTerrains[0];
  }

  // Получение текстуры
  private getTexture(terrainId: number): Texture {
    const findCache: (t: TerrainTextureCache) => boolean = t => t.terrain === terrainId;
    let texture: Texture;
    // Текстура из кэша
    if (this.textureCache.some(findCache)) {
      texture = this.textureCache.find(findCache).texture;
    }
    // Новая текстура
    else {
      const textureFile: string = this.path + "top/" + this.getTerrain(terrainId).name + ".jpg";
      texture = new TextureLoader().load(textureFile);
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      // Сохранить в кэш
      this.textureCache.push({ texture, terrain: terrainId });
    }
    // Вернуть текстуру
    return texture;
  }

  // Материалы
  getMaterial(terrainId: number, side: Side = DoubleSide): MeshPhongMaterial {
    const findCache: (m: TerrainMaterialCache) => boolean = m => m.terrain === terrainId && m.side === side;
    // Материал из кэша
    if (this.materialCache.some(findCache)) {
      return new MeshPhongMaterial().copy(this.materialCache.find(findCache).material);
    }
    // Новый материал
    else {
      const map: Texture = this.getTexture(terrainId);
      const material: MeshPhongMaterial = new MeshPhongMaterial({ map, side });
      // Сохранить в кэш
      this.materialCache.push({ side, material, terrain: terrainId });
      // Вернуть материал
      return material;
    }
  }
}





// Список типов местности
export const RoadTerrains: MapTerrain[] = [
  // Асфальт
  {
    id: 100001,
    name: "asphalt",
    title: "Асфальт",
    isAvail: false
  },
  // Бетон
  {
    id: 100002,
    name: "beton",
    title: "Бетон",
    isAvail: false
  },
];