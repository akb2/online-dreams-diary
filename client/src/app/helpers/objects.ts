import { ParseInt } from "./math";





// Сравнение двух объектов
export const CompareObjects: <T>(objA: T, objB: T) => boolean = <T>(objA: T, objB: T) => {
  const simpleType: boolean = !(!!objA && !!objB && ((Array.isArray(objA) && Array.isArray(objB)) || (typeof objA === "object" && typeof objB === "object")));
  // Простой тип
  if (simpleType) {
    return objA === objB;
  }
  // Массив
  else if (Array.isArray(objA) && Array.isArray(objB)) {
    return CompareArrays(objA, objB);
  }
  // Объекты
  else if (typeof objA === "object" && typeof objB === "object") {
    const arrayA: [string, any][] = Object.entries(objA);
    const arrayB: [string, any][] = Object.entries(objB);
    // Вернуть результат проверки
    return arrayA.length === arrayB.length && arrayA.every((v, k) => {
      const vA: any = v;
      const vB: any = arrayB[k];
      const simpleType: boolean = !(!!vA && !!vB && ((Array.isArray(vA) && Array.isArray(vB)) || (typeof vA === "object" && typeof vB === "object")));
      // Вернуть результат проверки
      return (
        (Array.isArray(vA) && Array.isArray(vB) && CompareArrays(vA, vB)) ||
        (typeof vA === "object" && typeof vB === "object" && CompareObjects(vA, vB)) ||
        (simpleType && vA === vB)
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
  const simpleType: boolean = !(!!vA && !!vB && ((Array.isArray(vA) && Array.isArray(vB)) || (typeof vA === "object" && typeof vB === "object")));
  // Вернуть результат проверки
  return (
    (Array.isArray(vA) && Array.isArray(vB) && CompareArrays(vA, vB)) ||
    (typeof vA === "object" && typeof vB === "object" && CompareObjects(vA, vB)) ||
    (simpleType && vA === vB)
  );
});

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
export const ForCycle = (size: number, callback: (index: number) => void, inverse: boolean = false) => {
  if (size > 0) {
    if (!inverse) {
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
export const ArrayForEach = <T>(array: T[], callback: (item: T, index?: number) => void, inverse: boolean = false) => {
  ForCycle(ParseInt(array?.length), index => {
    const item: T = array[index];
    // Вызвать обработку элемента
    callback(item, index);
  }, inverse);
};

// Оптимизированная фильтрация массива
export const ArrayFilter = <T>(array: T[], filterCallback: (item: T, index?: number) => boolean) => {
  const filteredArray: T[] = [];
  // Цикл по массиву
  ArrayForEach(array, (item: T, index: number) => filterCallback(item, index) ? filteredArray.unshift(item) : null);
  // Вернуть отфильрованный массив
  return filteredArray;
};

// Оптимизированное преобразование массива
export const ArrayMap = <O, T>(array: O[], callback: (item: O, index?: number) => T, inverse: boolean = false) => {
  const list: T[] = [];
  // Цикл
  ForCycle(ParseInt(array?.length), index => {
    const item: O = array[index];
    // Вызвать обработку элемента
    if (!inverse) {
      list.push(callback(item, index));
    }
    // Вызвать обработку элемента с инверсией
    else {
      list.unshift(callback(item, index));
    }
  }, inverse);
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

// Двумерный цикл по координатам
export const XYForEach = <T>(width: number, height: number, getItem: (x: number, y: number) => T, callback: (item: T, x?: number, y?: number) => void) => {
  ForCycle(height, y => ForCycle(width, x => {
    const item: T = getItem(x, y);
    // Обратный вызов
    callback(item, x, y);
  }, true), true);
};

// Двумерный цикл по координатам с возвращением результата
export const XYMapEach = <T>(width: number, height: number, getItem: (x: number, y: number) => T) => {
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
