import { CustomObject } from "@_models/app";
import { TagSetting } from "@_models/text";

// Теги, которые будут сохранены для редактора
export const FullModeSaveTags: string[] = ["h2", "h3", "h4", "h5", "h6", "i", "em", "b", "strong", "u", "s", "del"];
export const ShortModeSaveTags: string[] = [];

// Теги, которые будут удалены в редакторе
export const FullModeInlineRemoveTags: string[] = ["span"];
export const ShortModeInlineRemoveTags: string[] = ["span", "i", "b", "u", "s", "del", "bold", "strong", "italic"];
export const FullModeBlockRemoveTags: string[] = ["h1", "div", "p"];
export const ShortModeBlockRemoveTags: string[] = ["div", "p"];

// Настройки тега по умолчанию
export const DefaultTagSettings: TagSetting = {
  mustClose: true,
  mainAttr: "value",
  contentAttr: null,
  provideMainAttrToHtml: true,
  provideContentToMainAttr: false,
};

// Настройки тегов
export const TagSettings: CustomObject<TagSetting> = {
  a: {
    mustClose: true,
    mainAttr: "href",
    contentAttr: null,
    provideMainAttrToHtml: true,
    provideContentToMainAttr: true,
  },
  img: {
    mustClose: false,
    mainAttr: "src",
    contentAttr: "alt",
    provideMainAttrToHtml: false,
    provideContentToMainAttr: false,
  }
};
