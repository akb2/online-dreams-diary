// Минимальное и максимальное значение
export enum MinMax {
  min = "min",
  max = "max"
}

/**
 * Преобразование координат [X;Y] в индекс в матрице
 * @param {number} x Координата X
 * @param {number} y Координата Y
 * @param {number} width Ширина матрицы (для оси X)
 * @param {number} height Высота матрицы (для оси Y)
 * @returns {number} Индекс координат
 */
export const CoordsXYToIndex = (x: number, y: number, width: number, height?: number): number => {
  height = height ?? width;
  // Проверка координат
  if (x >= 0 && x < width && y >= 0 && y < height) {
    return (y * width) + x;
  }
  // Не удалось преобразовать
  return NaN;
};

/**
 * Преобразование координат [X;Y;Z] в индекс в матрице
 * @param {number} x Координата X
 * @param {number} y Координата Y
 * @param {number} z Координата Z
 * @param {number} width Ширина матрицы (для оси X)
 * @param {number} height Высота матрицы (для оси Y)
 * @param {number} depth Глубина матрицы (для оси Z)
 * @returns {number} Индекс координат
 */
export const CoordsXYZToIndex = (x: number, y: number, z: number, width: number, height?: number, depth?: number): number => {
  height = height ?? width;
  depth = depth ?? height;
  // Проверка координат
  if (z >= 0 && z < depth) {
    const indexXY = CoordsXYToIndex(x, y, width, height);
    // Расчитать результат
    if (!isNaN(indexXY)) {
      return (z * (width * height)) + indexXY;
    }
  }
  // Не удалось преобразовать
  return NaN;
};
