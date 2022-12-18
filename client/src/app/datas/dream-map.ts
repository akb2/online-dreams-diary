import { CustomObjectKey } from "@_models/app";
import { ClosestHeightName, MapTerrain, MapTerrainSplatMapColor, TextureType, WayLineType } from "@_models/dream-map";
import { ImageExtension } from "@_models/screen";





// Базовый путь к файлам текстур местости
export const BaseTexturePath: string = "assets/dream-map/terrain/";

// Путь к файлам текстур местости
export const TexturePaths: CustomObjectKey<TextureType, string> = {
  face: BaseTexturePath + "face/",
  normal: BaseTexturePath + "normal/",
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
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Земля
  {
    id: 2,
    name: "dirt",
    title: "Земля",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Камень
  {
    id: 3,
    name: "stone",
    title: "Камень",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Песок
  {
    id: 4,
    name: "sand",
    title: "Песок",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Снег
  {
    id: 5,
    name: "snow",
    title: "Снег",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
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
      exts: {
        face: d?.exts?.face as ImageExtension ?? ImageExtension.png,
        disp: d?.exts?.disp as ImageExtension ?? ImageExtension.png,
        normal: d?.exts?.normal as ImageExtension ?? ImageExtension.png,
        ao: d?.exts?.ao as ImageExtension ?? ImageExtension.png
      },
      splatMap: {
        layout,
        color: Colors[colorIndex]
      }
    };
  });

// Список имен соседних ячеек
export const ClosestHeightNames: ClosestHeightName[] = ["topLeft", "top", "topRight", "left", "right", "bottomLeft", "bottom", "bottomRight"];
