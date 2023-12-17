// Список инструментов
export enum Editor3DTool {
  landscape,
  terrain,
  objects
}

// Параметры инструмента
export interface Editor3DToolSettings {
  type: Editor3DTool;
  collapseSize: boolean;
  size: number;
}
