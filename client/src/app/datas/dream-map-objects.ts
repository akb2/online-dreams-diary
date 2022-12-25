import { CustomObjectKey } from "@_models/app";
import { DreamMapGroupObject, DreamMapGroupObjectType, DreamMapMixedObject, DreamMapObject, DreamMapObjectCatalog, DreamMapObjectType, ObjectController } from "@_models/dream-map-objects";
import { DreamMapPlantainGrassObject } from "@_services/dream-map/objects/grass/plantaingrass";
import { DreamMapWheatGrassObject } from "@_services/dream-map/objects/grass/wheatgrass";
import { DreamMapBirchTreeObject } from "@_services/dream-map/objects/tree/birch";
import { DreamMapFirTreeObject } from "@_services/dream-map/objects/tree/fir";
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
    sortIndex: 0,
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
    sortIndex: 1,
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
  // Елка
  {
    id: 3,
    sortIndex: 2,
    name: "Ель",
    catalog: 1,
    controllers: [DreamMapFirTreeObject],
    subTypeFunctions: {
      "tree-fir-branch": DreamMapFirTreeObject.getSubType,
      "tree-fir-leaf-a": DreamMapFirTreeObject.getSubType,
      "tree-fir-leaf-b": DreamMapFirTreeObject.getSubType
    },
    settings: {
      mixWithDefault: true,
      multiCeils: true
    }
  }
];

// Список групп объектов
const DreamMapGroupObjects: Partial<DreamMapGroupObject>[] = [
  // Лес
  {
    id: 1,
    ids: [1, 2, 3],
    sortIndex: 2,
    name: "Лес (случайное дерево)",
    icon: "forest",
    catalog: 1,
    settings: {
      multiCeils: true
    }
  }
];

export const DreamMapObjects: DreamMapMixedObject[] = [
  // Объекты
  ...DreamMapPartialObjects.map((data: Partial<DreamMapObject>) => ({
    id: data.id,
    type: "object" as DreamMapObjectType,
    sortIndex: data.sortIndex ?? 0,
    name: data.name,
    icon: !!data.icon ? data.icon : "",
    image: !!data.icon ? "" : "../../assets/dream-map/object/_icons/" + data.id + ".png",
    catalog: data.catalog,
    controllers: data.controllers,
    subTypeFunctions: data.subTypeFunctions,
    settings: {
      rotation: !!data?.settings?.rotation,
      variants: !!data?.settings?.variants,
      mixWithDefault: !!data?.settings?.mixWithDefault,
      multiCeils: !!data?.settings?.multiCeils,
    }
  } as DreamMapObject)),
  // Группы объектов
  ...DreamMapGroupObjects.map((data: Partial<DreamMapGroupObject>) => {
    const idPreffix: number = 100000000;
    const id: number = idPreffix + data.id;
    // Вернуть полный объект
    return {
      id,
      ids: data.ids,
      type: "group" as DreamMapGroupObjectType,
      sortIndex: data.sortIndex ?? 0,
      name: data.name,
      icon: !!data.icon ? data.icon : "",
      image: !!data.icon ? "" : "../../assets/dream-map/object/_icons/" + id + ".png",
      catalog: data.catalog,
      settings: {
        rotation: !!data?.settings?.rotation,
        variants: !!data?.settings?.variants,
        mixWithDefault: !!data?.settings?.mixWithDefault,
        multiCeils: !!data?.settings?.multiCeils,
      }
    } as DreamMapGroupObject;
  })
];