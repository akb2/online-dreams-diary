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
