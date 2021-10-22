// Данные для параметров
export interface DrawInterface {
  property: string | string[];
  data: DrawData;
}

// Данные для отрисовки
export interface DrawData {
  default: DrawDataPeriod;
  xsmall?: DrawDataPeriod;
  small?: DrawDataPeriod;
  middle?: DrawDataPeriod;
  large?: DrawDataPeriod;
  xlarge?: DrawDataPeriod;
}

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
  expand: string;
  process: string;
  collapse: string;
}

// Типы стилей для DrawDatas
export type DrawDatasKeys =
  "menu" |
  "menuList" |
  "menuListWithFloatingButton" |
  "menuItem" |
  "menuItemLine" |
  "helper" |
  "helperWithFloatingButton" |
  "header" |
  "scroll" |
  "title" |
  "titleWithBackButton" |
  "avatar" |
  "subtitle" |
  "subtitleWithBackButton" |
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