import { SimpleObject } from "@_models/app";





// Элемент главного меню
export interface MenuItem {
  id?: string;
  isSeparate?: boolean;
  active?: boolean;
  sort?: number;
  counter?: number;
  icon?: string;
  isSvgIcon?: boolean;
  image?: string;
  text?: string;
  desc?: string;
  link?: string;
  testAttr?: string;
  mobileView?: MenuItemMobileView;
  linkParams?: SimpleObject;
  callback?: () => void;
  children?: MenuItem[];
}

// Параметры мобильного вида
export interface MenuItemMobileView {
  leftPanel: boolean;
  bottomPanel: boolean;
}

// Тип способа авторизации
export enum AuthRules {
  notAuth,
  auth,
  anyWay
};

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
