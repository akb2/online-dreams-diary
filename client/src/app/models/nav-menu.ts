import { CustomObjectKey } from "@_models/app";

// Данные для параметров
export interface DrawInterface {
  property: string | string[];
  data: DrawData;
}

// Данные для отрисовки
export interface DrawData {
  default: DrawDataPeriod;
  xxsmall?: DrawDataPeriod;
  xsmall?: DrawDataPeriod;
  small?: DrawDataPeriod;
  middle?: DrawDataPeriod;
  large?: DrawDataPeriod;
  xlarge?: DrawDataPeriod;
}

// Список ключей данных для отрисовки
export const DrawDataKeys: (keyof DrawData)[] = ["default", "xxsmall", "xsmall", "small", "middle", "large", "xlarge"];

// Данные размеров
export interface DrawDataPeriod {
  min?: number | number[];
  max?: number | number[];
  value?: DrawDataValue;
  prefixUnit?: string;
  sufixUnit?: string;
  unit?: string | string[];
  separatorUnit?: string;
}

// Интерфейс выбора заранее заданных значений
export interface DrawDataValue {
  expand?: string;
  process?: string;
  collapse?: string;
  default: string;
}

// Типы стилей для DrawDatas
export type DrawDatasKeys =
  "menu" |
  "menuLayer" |
  "menuContainer" |
  "menuList" |
  "menuSubList" |
  "menuSubListDecorator" |
  "menuListWithFloatingButton" |
  "menuItem" |
  "menuItemLine" |
  "menuSubItem" |
  "menuSubItemLast" |
  "menuSubItemLine" |
  "menuSubItemSeparator" |
  "helper" |
  "helperWithFloatingButton" |
  "header" |
  "scroll" |
  "title" |
  "titleWithBackButton" |
  "titleWithBackButtonAndAvatar" |
  "titleWithAvatar" |
  "subtitle" |
  "subtitleWithBackButton" |
  "subtitleWithBackButtonAndAvatar" |
  "subtitleWithAvatar" |
  "image" |
  "avatar" |
  "avatarWithBackButton" |
  "floatingButton" |
  "floatingButtonOverlay" |
  "backButton" |
  "toContentButton"
  ;

// Типы меню
export enum NavMenuType {
  full = "full",
  short = "short",
  collapse = "collapse"
};

// Тип определяющего массива
export type DrawDataArray = CustomObjectKey<keyof DrawData, [number, number, string]>;
