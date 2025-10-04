import { CustomObjectKey } from "@_models/app";
import { XYCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { floor, round } from "@akb2/math";
import { ArrayForEach } from "./objects";





// Преобразовать данные в число
export const ParseInt = (value: any, defaultValue: number = 0) => {
  let num: number = parseInt(value);
  num = isNaN(num)
    ? defaultValue
    : num;
  // Вернуть число
  return num;
};

// Преобразовать данные в число
export const ParseFloat = (value: any, defaultValue: number = 0, afterDotNum: number = 0) => {
  let num: number = parseFloat(value);
  num = isNaN(num)
    ? defaultValue
    : num;
  // Вернуть число
  return round(num, afterDotNum);
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

/**
 * Получить угол прямоугольного треугольника по длинам катетов
 * @param {number} legA - Катет A
 * @param {number} legB - Катет B
 * @returns {number} Угол прилежащий к катету B
 */
export const AngleByLegs = (legA: number, legB: number): number => RadToAngle(Math.atan2(legA, legB));

// Колапсировать радианы
export const RadCollapse = (rad: number) => AngleToRad(AngleCollapse(RadToAngle(rad)));

// Синус и косинус в угол
export const SinCosToAngle = (sin: number, cos: number) => RadToAngle(SinCosToRad(sin, cos));

// Синус и косинус в радианы
export const SinCosToRad = (sin: number, cos: number) => Math.atan2(sin, cos);

/**
 * Перевести произвольные координаты в угол на окружности
 * @param {number} x Координата по оси X в диапазоне [-1; 1]
 * @param {number} y Координата по оси Y в диапазоне [-1; 1]
 * */
export const AngleByCoordsAndRadius = (x: number, y: number): number => AngleInRange(AngleByLegs(y, x));

/**
 * Преобразует произвольный угол в диапазон [0; 360], вычитанием 360 пока угол остается положительным
 * @param {number} angle Угол который требуется преобразовать
 * */
export const AngleInRange = (angle: number): number => {
  const maxAngle = 360;
  const circles = floor(angle / maxAngle);
  const newAngle = angle - (circles * maxAngle);
  // Рассчет
  return newAngle < 0
    ? newAngle + maxAngle
    : newAngle;
};

/**
 * Получить синус угла
 * @param {number} angle Угол в диапазоне [0; 360]
 * */
export const Sin = (angle: number): number => round(Math.sin(AngleToRad(angle)), 10);

/**
 * Получить косинус угла
 * @param {number} angle Угол в диапазоне [0; 360]
 * */
export const Cos = (angle: number): number => round(Math.cos(AngleToRad(angle)), 10);

// Тангенс угла
export const Tan: (angle: number) => number = (angle: number) => round(Math.tan(AngleToRad(angle)), 10);

// Катангенс угла
export const Ctg: (angle: number) => number = (angle: number) => round(1 / Math.tan(AngleToRad(angle)), 10);

// Округление по шагу
export const MathRoundByStep = (value: number, step: number = 1, afterDotNum: number = 0): number => round(
  round((value / step), afterDotNum) * step,
  afterDotNum
);

/**
 * Случайное число
 * @param {number} min Минимальное число
 * @param {number} max Максимальное число
 * @param {number} [noBorder=false] TRUE, чтобы не включать значения min и max в результат
 * @param {number} [afterDotNum=0] Количество десятичных знаков, например: [afterDotNum:2] => 10.26
 * @returns Новое случайное число
 */
export const Random = (min: number, max: number, noBorder: boolean = false, afterDotNum: number = 0) => {
  const border: number = noBorder ? 1 / Math.pow(10, afterDotNum) : 0;
  // Параметры
  min = min + border;
  max = max - border;
  // Вернуть случайное число
  return round(Math.random() * (max - min) + min, afterDotNum);
};

// Подготовка массива для среднего арифметического
const AverageArrayPrepare = (mixedValues: number[] | number[][]): number[] => typeof mixedValues?.[0] === "number"
  ? mixedValues as number[]
  : mixedValues[0] as number[];

// Подготовка усредненного значения
const AverageFunc = (
  callback: (current: number, value: number) => number,
  resultCallback: (result: number, count: number) => number,
  startValue: number,
  mixedValues: number[] | number[][]
): number => {
  const values: number[] = AverageArrayPrepare(mixedValues);
  const size = ParseInt(values?.length);
  // Получены параметры
  if (size > 0) {
    return round(resultCallback(values.reduce((o, v) => round(callback(o, v), 10), startValue), size), 10);
  }
  // Неудалось найти общее число
  return NaN;
};

// Среднее арифметическое
export const Average = (...values: number[] | number[][]) => AverageFunc((o, v) => o + v, (r, c) => r / c, 0, values);

// Сложить все элементы массива
export const AverageSumm = (...values: number[] | number[][]) => AverageFunc((o, v) => o + v, r => r, 0, values);

/**
 * Последовательное умножение всех чисел
 * @param {...number | number[]} values Список чисел
 * @returns Общее произведение всех чисел
 */
export const AverageMultiplySumm = (...values: number[] | number[][]) => AverageFunc((o, v) => o * v, r => r, 0, values);

// Среднее геометрическое
export const AverageGeometric = (...values: number[] | number[][]) => AverageFunc((o, v) => o * v, (r, c) => Math.pow(r, 1 / c), 1, values);

// Среднее гармоническое
export const AverageHarmonic = (...values: number[] | number[][]) => AverageFunc((o, v) => o + (1 / v), (r, c) => c / r, 0, values);

// Минимальное из массива
export const AverageMin = (...values: number[] | number[][]): number => AverageFunc((o, v) => Math.min(o, v), r => r, Infinity, values);

// Максимальное из массива
export const AverageMax = (...values: number[] | number[][]): number => AverageFunc((o, v) => Math.max(o, v), r => r, -Infinity, values);

// Медиана
export const AverageMedian = (...mixedValues: number[] | number[][]) => {
  const values = AverageArrayPrepare(mixedValues).sort((a, b) => a - b);
  const mid = values.length / 2;
  // Расчет медианы
  return values.length % 2 !== 0
    ? values[Math.floor(mid)]
    : (values[mid - 1] + values[mid]) / 2;
};

// Мода
export const AverageMode = (...mixedValues: number[] | number[][]) => {
  const values = AverageArrayPrepare(mixedValues).sort((a, b) => a - b);
  const frequency: CustomObjectKey<number, number> = {};
  let mode: number;
  let maxFreq = 0;
  // Цикл по значениям
  ArrayForEach(values, value => {
    frequency[value] = ParseInt(frequency?.[value]) + 1;
    // Вычисление
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  }, true);
  // Вернуть моду
  return mode;
};

// Среднее степенное
export const AveragePower = (power: number, ...values: number[] | number[][]) => AverageFunc(
  (c, v) => c + Math.pow(v, power),
  (r, c) => Math.pow(r / c, 1 / power),
  0,
  values
);

// Среднее квадратичное
export const AverageQuadratic = (...values: number[] | number[][]) => AveragePower(2, ...values);

// Умножение
export const AverageMultiply = (min: number, max: number, ...values: number[] | number[][]) => AverageFunc(
  (c, v) => c * ((v - min) / (max - min)),
  r => (r * (max - min)) + min,
  1,
  values
);

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
export const LineFunc = (min: number, max: number, v: number, vMin: number, vMax: number) => (((v - vMin) / (vMax - vMin)) * (max - min)) + min;

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

/**
 * Определяет направление на основе двух выражений.
 * @param positiveExpression - Функция, возвращающая булево значение, указывающее на положительное направление.
 * @param negativeExpression - Функция, возвращающая булево значение, указывающее на отрицательное направление.
 * @returns 1, если positiveExpression возвращает true, -1, если negativeExpression возвращает true, и 0, если оба выражения возвращают false.
 */
export const DetectDirectionByExpressions = (positiveExpression: boolean, negativeExpression: boolean): NumberDirection => positiveExpression
  ? 1
  : negativeExpression
    ? -1
    : 0;
