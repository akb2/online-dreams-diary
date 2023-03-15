import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, TemplateRef, ViewChild } from "@angular/core";
import { EmojiData, EmojiEvent, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { MultiObject, SimpleObject } from "@_models/app";
import { StringTemplatePipe } from "@_pipes/string-template-pipe";





@Component({
  selector: "app-comment-editor",
  templateUrl: "./comment-editor.component.html",
  styleUrls: ["./comment-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentEditorComponent {


  @Input() placeholder: string = "Напишите, что вы об этом думаете . . .";

  @ViewChild("editor", { read: ElementRef }) editor: ElementRef;
  @ViewChild("smile") smileElm: TemplateRef<any>;

  private lastPosition: CaretPosition = { start: 0, end: 0 };
  private smileSize: number = 24;

  showEmojiList: boolean = false;
  i18nEmoji: MultiObject<string> = I18nEmoji;





  // Получить текущий курсор
  private get getPos(): CaretPosition {
    let start: number = 0;
    let end: number = 0;
    // Поиск позиции
    if (!!this.editor?.nativeElement) {
      const range: Range = document.getSelection().getRangeAt(0);
      // Запомнить значения
      start = range.startOffset;
      end = range.endOffset;
    }
    // Вернуть позиции
    return { start, end };
  }

  // Стили смайлика
  private smileStyles(data: EmojiData): SimpleObject {
    return this.emojiService.emojiSpriteStyles(data.sheet, data.set, this.smileSize);
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private emojiService: EmojiService,
    private stringTemplatePipe: StringTemplatePipe
  ) { }





  // Потеря фокуса
  onBlur(): void {
    this.lastPosition = this.getPos;
  }

  // Открыть список смайликов
  onToggleEmoji(): void {
    this.showEmojiList = !this.showEmojiList;
    this.changeDetectorRef.detectChanges();
  }

  // Выбран смайлик
  onEmojiSelect(event: EmojiEvent): void {
    if (!!this.editor && !!event.emoji && !!this.smileElm) {
      const editor: HTMLElement = this.editor.nativeElement;
      // Фокус на поле
      editor.focus();
      // Параметры
      const emoji: EmojiData = event.emoji;
      const content: string = this.stringTemplatePipe.transform(this.smileElm, { styles: this.smileStyles(emoji), id: emoji.id, alt: emoji.name });
      const range: Range = document.getSelection().getRangeAt(0);
      const node: Element = (new DOMParser()).parseFromString(content, "text/html").getElementsByClassName("emoji-elm")[0];
      // Вставить смайлик
      range.insertNode(node);
    }
  }
}





// Позиция каретки в поле
interface CaretPosition {
  start: number;
  end: number;
}

// Переводы для списка смайликов
const I18nEmoji: MultiObject<string> = {
  search: "Поиск",
  emojilist: "Список смайликов",
  notfound: "Не найдено",
  clear: "Очистить",
  categories: {
    search: "Резуд=льтаты поиска",
    recent: "Недавние",
    people: "Люди",
    nature: "Животные и природа",
    foods: "Еда и напитки",
    activity: "Активность",
    places: "Места и путешествия",
    objects: "Объекты",
    symbols: "Символы",
    flags: "Флаги",
    custom: "Прочее",
  },
  skintones: {
    1: "Цвет кожи по умолчанию",
    2: "Белый цвет кожи",
    3: "Светлый цвет кожи",
    4: "Средний цвет кожи",
    5: "Темный цвет кожи",
    6: "Черный цвет кожи",
  },
};
