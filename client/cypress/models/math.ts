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
