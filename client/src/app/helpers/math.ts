import { XYCoord } from "@_models/dream-map";





// Преобразовать данные в число
export const ParseInt = (value: any, defaultValue: number = 0) => {
  let num: number = parseInt(value);
  num = isNaN(num) ? defaultValue : num;
  // Вернуть число
  return num;
};

// Преобразовать данные в число
export const ParseFloat = (value: any, defaultValue: number = 0, afterDotNum: number = 0) => {
  let num: number = parseFloat(value);
  num = isNaN(num) ? defaultValue : num;
  // Вернуть число
  return MathRound(num, afterDotNum);
};

// Проверить число в пределах и вернуть новое значение
export const CheckInRange = (value: number, max: number = Infinity, min: number = 0) => {
  value = value < min ? min : value;
  value = value > max ? max : value;
  // Вернуть значение
  return value;
};

// Проверка числа на четность
export const IsEven: (num: number) => boolean = (num: number) => num / 2 === Math.round(num / 2);

// Проверка числа на нечетность
export const IsOdd: (num: number) => boolean = (num: number) => !IsEven(num);

// Проверка числа на нечетность
export const IsMultiple = (num: number, del: number) => num / del === Math.round(num / del);

// Градусы в радианы
export const AngleToRad = (angle: number) => (Math.PI * angle) / 180;

// Радианы в градусы
export const RadToAngle = (rad: number) => (rad * 180) / Math.PI;

// Колапсировать угол 360 до 90 градусов
export const AngleCollapse = (angle: number) => {
  if (angle > 360) {
    angle = angle % 360;
  }
  // Угол меньше нуля
  if (angle < 0) {
    angle = angle % 360;
  }
  // Угол больше 180
  if (angle > 180) {
    angle = 360 - angle;
  }
  // Угол больше 90
  if (angle > 90) {
    angle = 180 - angle;
  }
  // Вернуть угол
  return angle;
};

// Колапсировать радианы
export const RadCollapse = (rad: number) => AngleToRad(AngleCollapse(RadToAngle(rad)));

// Синус и косинус в угол
export const SinCosToAngle = (sin: number, cos: number) => RadToAngle(SinCosToRad(sin, cos));

// Синус и косинус в радианы
export const SinCosToRad = (sin: number, cos: number) => Math.atan2(sin, cos);

// Синус угла
export const Sin: (angle: number) => number = (angle: number) => MathRound(Math.sin(AngleToRad(angle)), 10);

// Косинус угла
export const Cos: (angle: number) => number = (angle: number) => MathRound(Math.cos(AngleToRad(angle)), 10);

// Тангенс угла
export const Tan: (angle: number) => number = (angle: number) => MathRound(Math.tan(AngleToRad(angle)), 10);

// Катангенс угла
export const Ctg: (angle: number) => number = (angle: number) => MathRound(1 / Math.tan(AngleToRad(angle)), 10);

// Округление после запятой
export const MathRound = (value: number, afterDotNum: number = 0): number => {
  if (afterDotNum > 0) {
    const sqrt: number = Math.pow(10, afterDotNum);
    return Math.round((value * sqrt)) / sqrt;
  }
  // Округлить до целого
  return Math.round(value);
};

// Округление до меньшего
export const MathFloor = (value: number, afterDotNum: number = 0): number => {
  if (afterDotNum > 0) {
    const sqrt: number = Math.pow(10, afterDotNum);
    return Math.floor((value * sqrt)) / sqrt;
  }
  // Округлить до целого
  return Math.floor(value);
};

// Округление до большего
export const MathCeil = (value: number, afterDotNum: number = 0): number => {
  if (afterDotNum > 0) {
    const sqrt: number = Math.pow(10, afterDotNum);
    return Math.ceil((value * sqrt)) / sqrt;
  }
  // Округлить до целого
  return Math.ceil(value);
};

// Случайное число
export const Random = (min: number, max: number, noBorder: boolean = false, afterDotNum: number = 0) => {
  const border: number = noBorder ? 1 / Math.pow(10, afterDotNum) : 0;
  // Параметры
  min = min + border;
  max = max - border;
  // Вернуть случайное число
  return MathRound(Math.random() * (max - min) + min, afterDotNum);
};

// Среднее арифметическое
export const Average = (...mixedValues: number[] | number[][]): number => {
  const values: number[] = typeof mixedValues?.[0] === "number"
    ? mixedValues as number[]
    : mixedValues[0] as number[];
  const size = ParseInt(values?.length);
  // Получены параметры
  if (size > 0) {
    return values.reduce((o, v) => o + v, 0) / size;
  }
  // Неудалось найти общее число
  return NaN;
};

// Площадь треугольника
export const TriangleSquare: (a: XYCoord | XYCoord[], b?: XYCoord, c?: XYCoord) => number = (a: XYCoord | XYCoord[], b: XYCoord = null, c: XYCoord = null) => {
  if (Array.isArray(a)) {
    [, b, c] = a;
    a = a[0] as unknown as XYCoord;
  }
  // Вернуть площадь или ошибку
  return !!a && !!b && !!c ?
    0.5 * (Math.abs((a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y))) :
    0;
};

// Расстояние между двумя точками
export const LengthByCoords = (a: XYCoord, b: XYCoord = { x: 0, y: 0 }) => Math.sqrt(Math.pow(Math.abs(a.x - b.x), 2) + Math.pow(Math.abs(a.y - b.y), 2));

// Получить гипотенузу по сторонам
export const GetHypotinuze = (a: number, b: number = Infinity) => {
  b = b === Infinity ? a : b;
  // Вернуть гипотенузу
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

// Линейная функция расчета
export const LineFunc = (min: number, max: number, value: number, valueMin: number, valueMax: number) => (((min - max) / valueMax) * (value - valueMin)) + max;

// Получить расстояние от центра квадрата к одной из его граней по углу
export const GetLengthFromSquareCenter = (size: number, angle: number) => {
  const collapsedAngle: number = Math.abs(AngleCollapse(angle));
  // Исключение
  if (collapsedAngle === 0 || collapsedAngle === 90) {
    return size / 2;
  }
  // Посчитать расстояние
  return CheckInRange(
    Math.abs(size / (2 * Math.cos(AngleToRad(collapsedAngle)))),
    GetHypotinuze(size) / 2,
    size / 2
  );
};
