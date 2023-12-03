import { CustomObjectKey } from "@_models/app";
import { ClosestHeightName, DreamMapSector, MapTerrain, MapTerrainSplatMapColor, TextureType, WayLineType, XYCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";





// Базовый путь к файлам текстур местости
export const BaseTexturePath: string = "assets/dream-map/";
export const TerrainTexturePath: string = BaseTexturePath + "terrain/";
export const ReliefTexturePath: string = BaseTexturePath + "relief/";

// Путь к файлам текстур местности
export const TexturePaths: CustomObjectKey<TextureType, string> = {
  icons: TerrainTexturePath + "icons/",
  face: TerrainTexturePath + "face",
  normal: TerrainTexturePath + "normal",
  ao: TerrainTexturePath + "ao",
  roughness: TerrainTexturePath + "roughness",
  metalness: TerrainTexturePath + "metalness",
  light: TerrainTexturePath + "light",
};

const BaseObjectTexturePath: string = "assets/dream-map/object/";
export const ObjectTexturePaths: (name: string, type: TextureType) => string = (name: string, type: TextureType) => {
  const paths: CustomObjectKey<TextureType, string> = {
    face: BaseObjectTexturePath + name + "/face/",
    normal: BaseObjectTexturePath + name + "/normal/",
  };
  // Вернуть путь
  return paths[type];
};

// Набор типов линий
export const WayLineTypes: WayLineType[] = [
  //
  {
    type: "solid",
    title: "Ходьба / езда",
    description: "Перемещение пешком, автомобиле, велосипеде и т.д."
  },
  //
  {
    type: "double",
    title: "Полет",
    description: "Персонаж летит сам, или на транспорте, или другом существе"
  },
  //
  {
    type: "dashed",
    title: "Плавание",
    description: "Персонаж плывет сам, или на транспорте, или на другом существе"
  },
  //
  {
    type: "dotted",
    title: "Телепортация",
    description: "Персонаж перемещается из одной точки в другую, минуя пространство"
  }
];

// Список цветов для
const Colors: MapTerrainSplatMapColor[] = [MapTerrainSplatMapColor.Red, MapTerrainSplatMapColor.Green, MapTerrainSplatMapColor.Blue, MapTerrainSplatMapColor.Alpha];

// Список типов местности
export const MapTerrains: MapTerrain[] = [
  // Газон
  {
    id: 1,
    name: "grass",
    title: "Газон",
    tileCoords: { x: 1, y: 0 }
  },
  // Земля
  {
    id: 2,
    name: "dirt",
    title: "Земля",
    tileCoords: { x: 0, y: 0 }
  },
  // Камень
  {
    id: 3,
    name: "stone",
    title: "Камень",
    tileCoords: { x: 0, y: 1 }
  },
  // Песок
  {
    id: 4,
    name: "sand",
    title: "Песок",
    tileCoords: { x: 2, y: 0 }
  },
  // Снег
  {
    id: 5,
    name: "snow",
    title: "Снег",
    tileCoords: { x: 3, y: 0 }
  }
]
  // Преобразовать в тип
  .map(d => d as MapTerrain)
  // Дополнить модель данными по умолчанию
  .map((d, k) => {
    const layout: number = Math.floor(k / Colors.length);
    const colorIndex: number = k - (layout * Colors.length);
    // Вернуть модель
    return {
      ...d,
      isAvail: !!d?.isAvail || true,
      splatMap: {
        layout,
        color: Colors[colorIndex]
      }
    };
  });

// Список имен соседних ячеек
export const ClosestHeightNames: ClosestHeightName[] = ["topLeft", "top", "topRight", "left", "right", "bottomLeft", "bottom", "bottomRight"];

// Сектора карты
export const DreamMapSectors: CustomObjectKey<NumberDirection, CustomObjectKey<NumberDirection, DreamMapSector>> = {
  [-1]: {
    [-1]: "topLeft",
    [0]: "top",
    [1]: "topRight"
  },
  [0]: {
    [-1]: "left",
    [0]: "center",
    [1]: "right"
  },
  [1]: {
    [-1]: "bottomLeft",
    [0]: "bottom",
    [1]: "bottomRight"
  },
};

// Соседние ячейки
export const NeighBoringSectors: CustomObjectKey<DreamMapSector, CustomObjectKey<ClosestHeightName, ClosestHeightName>> = {
  // Верх - лево
  topLeft: {
    right: "top",
    bottom: "left"
  },
  // Верх
  top: {
    left: "topLeft",
    right: "topRight",
    bottomLeft: "left",
    bottomRight: "right"
  },
  // Верх - право
  topRight: {
    left: "top",
    bottom: "right"
  },
  // Лево
  left: {
    top: "topLeft",
    bottom: "bottomLeft",
    topRight: "top",
    bottomRight: "bottom"
  },
  // Центр
  center: {
    topLeft: "topLeft",
    top: "top",
    topRight: "topRight",
    left: "left",
    right: "right",
    bottomLeft: "bottomLeft",
    bottom: "bottom",
    bottomRight: "bottomRight"
  },
  // Право
  right: {
    top: "topRight",
    bottom: "bottomRight",
    topLeft: "top",
    bottomLeft: "bottom"
  },
  // Низ - лево
  bottomLeft: {
    top: "left",
    right: "bottom"
  },
  // Низ
  bottom: {
    left: "bottomLeft",
    right: "bottomRight",
    topLeft: "left",
    topRight: "right"
  },
  // Низ - право
  bottomRight: {
    left: "bottom",
    top: "right"
  }
};

// Координаты смещений по типу соседнего блока
export const NeighBoringShifts: CustomObjectKey<DreamMapSector, XYCoord<NumberDirection>> = {
  topLeft: { x: -1, y: -1 },
  top: { x: 0, y: -1 },
  topRight: { x: 1, y: -1 },
  left: { x: -1, y: 0 },
  center: { x: 0, y: 0 },
  right: { x: 1, y: 0 },
  bottomLeft: { x: -1, y: 1 },
  bottom: { x: 0, y: 1 },
  bottomRight: { x: 1, y: 1 },
};
