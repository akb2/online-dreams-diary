import { SimpleObject } from "@_models/app";





// Элемент главного меню
export interface MenuItem {
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