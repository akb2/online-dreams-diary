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
export const IsMultiple: (num: number, del: number) => boolean = (num: number, del: number) => num / del === Math.round(num / del);

// Градусы в радианы
export const AngleToRad: (angle: number) => number = (angle: number) => (Math.PI * angle) / 180;

// Радианы в градусы
export const RadToAngle: (rad: number) => number = (rad: number) => (rad * 180) / Math.PI;

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
export const MathRound: (value: number, afterDotNum?: number) => number = (value: number, afterDotNum: number = 0): number => {
  if (afterDotNum > 0) {
    const sqrt: number = Math.pow(10, afterDotNum);
    return Math.round((value * sqrt)) / sqrt;
  }
  // Округлить до целого
  return Math.round(value);
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

// Линейная функция расчета
export const LineFunc = (min: number, max: number, value: number, valueMin: number, valueMax: number) => (((min - max) / valueMax) * (value - valueMin)) + max;
