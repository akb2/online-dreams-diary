// Список инструментов
export enum Editor3DTool {
  landscape,
  terrain,
  objects
}

// Параметры инструмента
export interface Editor3DToolSettings<T> {
  collapseSize: boolean;
}
