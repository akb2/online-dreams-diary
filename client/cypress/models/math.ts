import { round } from "@akb2/math";

// Случайное число
export const Random = (min: number, max: number, noBorder: boolean = false, afterDotNum: number = 0) => {
  const border: number = noBorder ? 1 / Math.pow(10, afterDotNum) : 0;
  // Параметры
  min = min + border;
  max = max - border;
  // Вернуть случайное число
  return round(Math.random() * (max - min) + min, afterDotNum);
};
