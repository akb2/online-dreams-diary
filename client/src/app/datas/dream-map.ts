import { CustomObjectKey } from "@_models/app";
import { ClosestHeightName, MapTerrain, MapTerrainSplatMapColor, TextureType, WayLineType } from "@_models/dream-map";





// Базовый путь к файлам текстур местости
export const BaseTexturePath: string = "assets/dream-map/terrain/";

// Путь к файлам текстур местности
export const TexturePaths: CustomObjectKey<TextureType, string> = {
  icons: BaseTexturePath + "icons/",
  face: BaseTexturePath + "face",
  normal: BaseTexturePath + "normal/",
  ao: BaseTexturePath + "ao/",
  light: BaseTexturePath + "light/",
};

const BaseobjectTexturePath: string = "assets/dream-map/object/";
export const ObjectTexturePaths: (name: string, type: TextureType) => string = (name: string, type: TextureType) => {
  const paths: CustomObjectKey<TextureType, string> = {
    face: BaseobjectTexturePath + name + "/face/",
    normal: BaseobjectTexturePath + name + "/normal/",
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
const Colors: MapTerrainSplatMapColor[] = [MapTerrainSplatMapColor.Red, MapTerrainSplatMapColor.Green, MapTerrainSplatMapColor.Blue];

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
