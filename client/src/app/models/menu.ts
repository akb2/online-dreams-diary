// Элемент главного меню
export interface MenuItem {
  auth: AuthRules;
  icon: string;
  text: string;
  desc?: string;
  callback?: () => void;
  link?: string;
  linkParams?: { [key: string]: string };
}

// Тип способа авторизации
// * Ключ auth отвечает за показ пунктов:
// * -1: Только неавторизованным
// * 0: Всегда
// * 1: Только авторизованным
export type AuthRules = -1 | 0 | 1;