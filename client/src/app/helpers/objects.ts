import { CoordDto, XYCoord } from "@_models/dream-map";
import { IsSimpleObject } from "./app";
import { ParseInt } from "./math";
import { invert } from "cypress/types/lodash";



// Преобразовать любой тип в массив
export const AnyToArray = <T>(value: T | T[]): T[] => Array.isArray(value)
  ? value
  : !!value
    ? [value]
    : [];

// Сравнение двух объектов
export const CompareObjects: <T>(objA: T, objB: T) => boolean = <T>(objA: T, objB: T) => {
  if (IsSimpleType(objA, objB)) {
    return objA === objB;
  }
  // Массив
  else if (Array.isArray(objA) && Array.isArray(objB)) {
    return CompareArrays(objA, objB);
  }
  // Объекты
  else if (IsSimpleObject(objA) && IsSimpleObject(objB)) {
    const arrayA: [string, any][] = Object.entries(objA);
    const arrayB: [string, any][] = Object.entries(objB);
    // Вернуть результат проверки
    return arrayA.length === arrayB.length && arrayA.every((v, k) => {
      const vA: any = v;
      const vB: any = arrayB[k];
      // Вернуть результат проверки
      return (
        (Array.isArray(vA) && Array.isArray(vB) && CompareArrays(vA, vB)) ||
        (IsSimpleObject(vA) && IsSimpleObject(vB) && CompareObjects(vA, vB)) ||
        (IsSimpleType(vA, vB) && vA === vB)
      );
    });
  }
  // Разные типы данных
  return false;
};

// Сравнение двух масивов
export const CompareArrays: <T>(arrayA: T[], arrayB: T[]) => boolean = <T>(arrayA: T[], arrayB: T[]) => arrayA?.length === arrayB?.length && arrayA.every((v, k) => {
  const vA: T = v;
  const vB: T = arrayB[k];
  // Вернуть результат проверки
  return (
    (Array.isArray(vA) && Array.isArray(vB) && CompareArrays(vA, vB)) ||
    (IsSimpleObject(vA) && IsSimpleObject(vB) && CompareObjects(vA, vB)) ||
    (IsSimpleType(vA, vB) && vA === vB)
  );
});

// Базовый тип
// ? Подходит для определения, можно ли сравнить два элемента между собой с помощью логических операторов для CompareObjects и CompareArrays
const IsSimpleType = (a, b): boolean => !(
  !!a &&
  !!b && (
    (Array.isArray(a) && Array.isArray(b)) ||
    (IsSimpleObject(a) && IsSimpleObject(b))
  )
);

// Убрать повторения из массива
export const UniqueArray: <T>(a: T[]) => T[] = <T>(a: T[]) => {
  if (a.every(e => e?.hasOwnProperty("id"))) {
    const ids: string[] = [];
    // Search ID's
    a.forEach(e => ids.includes(e["id"]) ? null : ids.push(e["id"]));
    // Return only unique items
    return ids.map(id => a.find(e => e["id"] === id));
  }
  // Simple type
  return Array.from(new Set(a))
};

// Оптимизированный цикл
export const ForCycle = (size: number, callback: (index: number) => void, invert = false) => {
  if (size > 0) {
    if (!invert) {
      for (let i = 0; i < size; i++) {
        callback(i);
      }
    }
    // Инвертированный цикл
    else {
      for (let i = size - 1; i >= 0; i--) {
        callback(i);
      }
    }
  }
};

// Оптимизированный цикл с возвращаемыми данными
export const MapCycle = <T>(size: number, callback: (index: number) => T, inverse: boolean = false) => {
  const list: T[] = [];
  // Цикл
  if (size > 0) {
    if (!inverse) {
      for (let i = 0; i < size; i++) {
        list.push(callback(i));
      }
    }
    // Инвертированный цикл
    else {
      for (let i = size - 1; i >= 0; i--) {
        list.unshift(callback(i));
      }
    }
  }
  // Вернуть массив
  return list;
};

// Оптимизированный цикл по массиву
export const ArrayForEach = <T>(array: T[], callback: (item: T, index?: number) => void, invert = false) => ForCycle(
  ParseInt(array?.length),
  index => {
    const item: T = array[index];
    // Вызвать обработку элемента
    callback(item, index);
  },
  invert
);

// Оптимизированная фильтрация массива
export const ArrayFilter = <T>(array: T[], filterCallback: (item: T, index?: number) => boolean, invert = false) => {
  const filteredArray: T[] = [];
  // Цикл по массиву
  ArrayForEach(
    array,
    (item: T, index: number) => filterCallback(item, index)
      ? invert
        ? filteredArray.push(item)
        : filteredArray.unshift(item)
      : null,
    true
  );
  // Вернуть отфильрованный массив
  return filteredArray;
};

// Оптимизированное преобразование массива
export const ArrayMap = <O, T>(array: O[], callback: (item: O, index?: number) => T, invert = false) => {
  const list: T[] = [];
  // Цикл
  ForCycle(
    ParseInt(array?.length),
    index => {
      const item: O = array[index];
      // Вызвать обработку элемента
      if (!invert) {
        list.push(callback(item, index));
      }
      // Вызвать обработку элемента с инверсией
      else {
        list.unshift(callback(item, index));
      }
    },
    invert
  );
  // Вернуть массив
  return list;
};

// Оптимизированный поиск вхождения
export const ArrayFind = <T>(array: T[], searchCallback: (item: T, index?: number) => boolean) => {
  const arraySize: number = array?.length ?? 0;
  // Массив содержит элементы
  if (arraySize > 0) {
    for (let index: number = arraySize - 1; index >= 0; index--) {
      const item: T = array[index];
      // Элемент найден
      if (searchCallback(item, index)) {
        return item;
      }
    }
  }
  // Ничего не найдено
  return null;
};

// Оптимизированный поиск вхождения в массиве
export const ArraySome = <T>(array: T[], searchCallback: (item: T, index?: number) => boolean) => !!ArrayFind(array, searchCallback);

/**
 * Двумерный цикл по координатам
 * @param {number} width Ширина (количество повторов для X)
 * @param {number} height Высота (количество повторов для Y)
 * @param {(x: number, y: number) => T} getItem Функция для преобразования координат в объект
 * @param {(item: T, x?: number, y?: number) => void} callback Функция выполняемая для каждой иттерации
 * @returns
 */
export const XYForEach = <T>(
  width: number,
  height: number,
  getItem: (x: number, y: number) => T,
  callback: (item: T, x?: number, y?: number) => void
) => ForCycle(height, y => ForCycle(width, x => {
  const item: T = getItem(x, y);
  // Обратный вызов
  callback(item, x, y);
}, true), true);

// Двумерный цикл по координатам с возвращением результата
export const XYMapEach = <T = XYCoord>(width: number, height: number, getItem = (x: number, y: number) => <T>({ x, y })): T[] => {
  const list: T[] = [];
  // Цикл
  for (let y: number = height - 1; y >= 0; y--) {
    for (let x: number = width - 1; x >= 0; x--) {
      list.unshift(getItem(x, y));
    }
  }
  // Вернуть массив
  return list;
};

/**
 * Трехмерный цикл по координатам
 * @param {number} width Ширина (количество повторов для X)
 * @param {number} height Высота (количество повторов для Y)
 * @param {number} depth Глубина (количество повторов для Z)
 * @param {(x: number, y: number, z: number) => T} getItem Функция для преобразования координат в объект
 * @param {(item: T, x?: number, y?: number, z?: number) => void} callback Функция выполняемая для каждой иттерации
 */
export const XYZForEach = <T = CoordDto>(
  width: number,
  height: number,
  depth: number,
  getItem: (x: number, y: number, z: number) => T,
  callback: (item: T, x?: number, y?: number, z?: number) => void
): void => ForCycle(depth, z => XYForEach(
  width,
  height,
  (x, y) => getItem(x, y, z),
  (item, x, y) => callback(item, x, y, z)
));

/**
 * Получить 2D координату по индексу, где:
 * Y является округлением частного индекса на ширину до меньшего целого
 * X является целочисленным остатком от частного индекса на ширину
 * @param {number} width Ширина
 * @param {number} height Высота
 * @param {number} index Индекс координаты
 * @returns {XYCoord} [X;Y] - координаты
 */
export const GetCoordsByIndex = (width: number, height: number, index: number): XYCoord => index >= 0 && index < width * height
  ? { x: index % width, y: Math.floor(index / width) }
  : null;

/**
 * Преобразование размеров объекта в относительные размеры. Минимальный размер становиться
 * @param {number} x Ширина
 * @param {number} y Высота
 * @param {number} z Глубина
 * @returns {CoordDto} Масштабированные размеры объекта
 */
export const Scalize3D = (x: number, y: number, z: number): CoordDto => {
  const minimal = Math.min(x, y, z);
  // Преобразование
  return {
    x: x / minimal,
    y: y / minimal,
    z: z / minimal
  };
}
