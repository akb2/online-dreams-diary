import { environment } from "@_environments/environment";





/**
 * Преобразовать строку в JSON
 * @param {string} value - Исходные данные в виде строки
 * @param {T} [defaultValue=null] - Значение, которое будет присвоено объекту в случае ошибки
 * @return {T} - Полученный из строки JSON объект
 * @template T - Тип, который будет использоваться для возвращаемого значения
 */
export const JsonDecode = <T>(value: string, defaultValue: T = null): T => {
  let data: T;
  // Попытаться расшифровать
  try {
    data = JSON.parse(value);
  }
  catch (error: any) {
    data = defaultValue;
  }
  // Вернуть данные
  return data;
}

// Проверить значение внутри Enum
export const IsInEnum = <T>(value: string | number, enumType: T): boolean => Object.values(enumType).includes(value);

// Любой тип в булев
export const ToBoolean = (value: any): boolean => {
  const trueValues: (string | number | boolean)[] = ["true", "on", "enabled", "1", 1, true];
  // Проверка
  return trueValues.includes(value);
};

// Получить полную ссылку на базовый домен приложения
export const GetBaseUrl = (): string => environment.baseUrl[window.location.hostname] ?? environment.baseUrl.default;

// Получить полную ссылку на Api домен приложения
export const GetBaseApiUrl = (): string => environment.baseApiUrl[window.location.hostname] ?? environment.baseApiUrl.default;

// Элементы внутри Tree Walker
export const TreeWalkerToArray = (treeWalker: TreeWalker, range: Range): Node[] => {
  const elementsToWrap: Node[] = [];
  let currentNode: Node = treeWalker?.currentNode;
  // Цикл по элементам
  while (!!currentNode) {
    if (range.intersectsNode(currentNode) && currentNode.nodeType === Node.TEXT_NODE) {
      elementsToWrap.push(currentNode);
    }
    // Следующий элемент
    currentNode = treeWalker?.nextNode();
  }
  // Вернуть массив
  return elementsToWrap;
};

// Обход родителей элемента
export const ElementParentsArray = (elm: Node | HTMLElement, lastParent: Node | HTMLElement = document.body, elmInclude: boolean = false) => {
  const nodes: Node[] = elmInclude ? [elm] : [];
  let node: Node | HTMLElement = elm;
  // Цикл по элементам
  while (!!node && node.parentElement !== lastParent) {
    node = node.parentElement;
    // Добавить элемент
    nodes.push(node);
  }
  // Вернуть список
  return nodes;
};

// Элемент экземпляр DOM
export const IsDOM = (obj: any): boolean => typeof obj === "object" && obj instanceof Element;

// Проверка на объект
export const IsSimpleObject = (obj: any): boolean => typeof obj === "object" && !IsDOM(obj);

// Найти первый текстовый узел
export const GetTextNodes = (elm: Node | ChildNode | HTMLElement): Node[] => {
  const textNodes: Node[] = [];
  // Проверить сам элемент
  if (elm.nodeType === Node.TEXT_NODE) {
    textNodes.push(elm);
  }
  // Поиск по вложениям
  else if (elm.hasChildNodes()) {
    Array.from(elm.childNodes).forEach(node => node.nodeType === Node.TEXT_NODE ?
      textNodes.push(node) :
      textNodes.push(...GetTextNodes(node))
    );
  }
  // Вернуть текстовые узлы
  return textNodes;
};
