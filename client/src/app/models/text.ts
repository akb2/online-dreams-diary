// Позиция каретки в поле
export interface CaretPosition {
  range: Range;
  start: number;
  end: number;
}

// Параметры тега
export interface TagSetting {
  mustClose: boolean;
  mainAttr: string;
  contentAttr: string;
  provideMainAttrToHtml: boolean;
  provideContentToMainAttr: boolean;
}
