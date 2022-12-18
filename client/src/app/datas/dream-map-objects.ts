import { CustomObjectKey } from "@_models/app";
import { DreamMapObject, DreamMapObjectCatalog, ObjectController } from "@_models/dream-map-objects";
import { DreamMapPlantainGrassObject } from "@_services/dream-map/objects/grass/plantaingrass";
import { DreamMapWheatGrassObject } from "@_services/dream-map/objects/grass/wheatgrass";
import { DreamMapBirchTreeObject } from "@_services/dream-map/objects/tree/birch";
import { DreamMapOakTreeObject } from "@_services/dream-map/objects/tree/oak";





// Список ландшафтов с объектами для пустых ячеек
export const ObjectControllers: CustomObjectKey<number, ObjectController[]> = {
  1: [DreamMapWheatGrassObject, DreamMapPlantainGrassObject],
};

// Список ландшафтов с объектами для пустых ячеек
export const ObjectStaticSubTypeControllers: CustomObjectKey<number, CustomObjectKey<string, Function>> = {
  1: {
    wheatgrass: DreamMapWheatGrassObject.getSubType,
    plantaingrass: DreamMapPlantainGrassObject.getSubType
  },
};

// Список категорий объектов
export const DreamMapObjectCatalogs: DreamMapObjectCatalog[] = [
  // Растения
  {
    id: 1,
    icon: "forest",
    name: "Растительность"
  },
];

// Список объектов
const DreamMapPartialObjects: Partial<DreamMapObject>[] = [
  // Дуб
  {
    id: 1,
    name: "Дуб",
    catalog: 1,
    controllers: [DreamMapOakTreeObject],
    subTypeFunctions: {
      "tree-oak-branch": DreamMapOakTreeObject.getSubType,
      "tree-oak-leaf": DreamMapOakTreeObject.getSubType
    },
    settings: {
      mixWithDefault: true,
      multiCeils: true
    }
  },
  // Береза
  {
    id: 2,
    name: "Берёза",
    catalog: 1,
    controllers: [DreamMapBirchTreeObject],
    subTypeFunctions: {
      "tree-birch-branch": DreamMapBirchTreeObject.getSubType,
      "tree-birch-leaf": DreamMapBirchTreeObject.getSubType
    },
    settings: {
      mixWithDefault: true,
      multiCeils: true
    }
  },
];

export const DreamMapObjects: DreamMapObject[] = DreamMapPartialObjects.map((data: Partial<DreamMapObject>) => ({
  id: data.id,
  name: data.name,
  image: "../../assets/dream-map/object/_icons/" + data.id + ".png",
  catalog: data.catalog,
  controllers: data.controllers,
  subTypeFunctions: data.subTypeFunctions,
  settings: {
    rotation: !!data?.settings?.rotation,
    variants: !!data?.settings?.variants,
    mixWithDefault: !!data?.settings?.mixWithDefault,
    multiCeils: !!data?.settings?.multiCeils,
  }
}))
