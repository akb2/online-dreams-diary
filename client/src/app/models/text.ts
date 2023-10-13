// Позиция каретки в поле
export interface CaretPosition {
  selection: Selection;
  range: Range;
  start: number;
  end: number;
}

// Параметры тега
export interface TagSetting {
  replaceTag?: string;
  mustClose: boolean;
  mainAttr: string;
  contentAttr: string;
  provideMainAttrToHtml: boolean;
  provideContentToMainAttr: boolean;
  provideMainAttrToStyleProperty?: string | string[];
}
