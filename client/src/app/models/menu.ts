import { SimpleObject } from "@_models/app";





// Элемент главного меню
export interface MenuItem {
  id?: string;
  isSeparate?: boolean;
  active?: boolean;
  sort?: number;
  icon?: string;
  text?: string;
  desc?: string;
  link?: string;
  linkParams?: SimpleObject;
  callback?: () => void;
  children?: MenuItem[];
}

// Тип способа авторизации
// * Ключ auth отвечает за показ пунктов:
// * -1: Только неавторизованным
// * 0: Всегда
// * 1: Только авторизованным
export type AuthRules = -1 | 0 | 1;

// Интерфейс списка пунктов меню по статусу авторизации
export interface MenuItemsListAuth {
  auth: MenuItem[];
  notAuth: MenuItem[];
  any: MenuItem[];
}

// Интерфейс списка пунктов меню по типу устройства
export interface MenuItemsListDevices {
  desktop: MenuItemsListAuth;
  mobile: MenuItemsListAuth;
}
