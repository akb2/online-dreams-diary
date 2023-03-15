import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { EmojiData, EmojiEvent, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { WaitObservable } from "@_datas/api";
import { CompareElementByElement } from "@_datas/app";
import { MultiObject, SimpleObject } from "@_models/app";
import { StringTemplatePipe } from "@_pipes/string-template-pipe";
import { concatMap, filter, fromEvent, map, Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-comment-editor",
  templateUrl: "./comment-editor.component.html",
  styleUrls: ["./comment-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentEditorComponent implements AfterViewInit, OnDestroy {


  @Input() placeholder: string = "Напишите, что вы об этом думаете . . .";

  @ViewChild("editor", { read: ElementRef }) editor: ElementRef<HTMLElement>;
  @ViewChild("smile") smileElm: TemplateRef<any>;
  @ViewChild("emojiListItem", { read: ElementRef }) emojiListItem: ElementRef<HTMLElement>;
  @ViewChild("emojiListToggleButton", { read: ElementRef }) emojiListToggleButton: ElementRef<HTMLElement>;

  private lastPosition: CaretPosition;
  private smileSize: number = 24;

  showEmojiList: boolean = false;
  i18nEmoji: MultiObject<string> = I18nEmoji;
  emojiClassName: string = "emoji-elm";

  private destroyed$: Subject<void> = new Subject();





  // Получить текущий курсор
  private getRangePosition(forceFocus: boolean = false): CaretPosition {
    const editor: HTMLElement = this.editor?.nativeElement;
    let start: number = 0;
    let end: number = 0;
    let range: Range = new Range();
    // Поиск позиции
    if (!!editor) {
      if (editor !== document.activeElement && forceFocus) {
        editor.focus();
      }
      // Запомнить значения
      range = document.getSelection().getRangeAt(0);
      start = range.startOffset;
      end = range.endOffset;
    }
    // Вернуть позиции
    return { start, end, range };
  }

  // Стили смайлика
  private smileStyles(data: EmojiData): SimpleObject {
    return this.emojiService.emojiSpriteStyles(data.sheet, data.set, this.smileSize);
  }

  // Установить текст
  private insertContent(content: string | Node): void {
    if (!this.lastPosition) {
      this.lastPosition = this.getRangePosition(true);
    }
    // Убрать контент
    this.lastPosition.range.deleteContents();
    // Вставить текст
    if (typeof content === "string") {
      this.lastPosition.range.insertNode(document.createTextNode(content));
    }
    // Вставеть HTML
    else {
      this.lastPosition.range.insertNode(content);
    }
    // Убрать выделение
    this.lastPosition.range.collapse();
  }

  // Получить шаблон смайлика
  private getSmileNode(mixedEmoji: string | EmojiData): Element {
    const emoji: EmojiData = typeof mixedEmoji === "string" ? this.emojiService.getData(mixedEmoji) : mixedEmoji;
    const content: string = this.stringTemplatePipe.transform(this.smileElm, { styles: this.smileStyles(emoji), id: emoji.id, alt: emoji.name });
    const node: Element = (new DOMParser()).parseFromString(content, "text/html").getElementsByClassName(this.emojiClassName)[0];
    // Вернуть шаблон
    return node;
  }

  // Получить содержимое поля ввода
  get getEditorValue(): string {
    const editor: HTMLElement = this.editor?.nativeElement;
    const tempEditor: HTMLElement = document.createElement("div");
    // Редактор определен
    if (!!editor) {
      tempEditor.innerHTML = editor.innerHTML;
      // Заполнить текст
      this.editorTagInterpolate(tempEditor);
      this.editorBlockReplace(tempEditor);
      this.editorInlineReplace(tempEditor);
      this.editorEmojiReplace(tempEditor);
      this.editorSpacingReplace(tempEditor);
      // Вернуть текст
      return tempEditor.innerHTML;
    }
    // Пусто
    return "";
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private emojiService: EmojiService,
    private stringTemplatePipe: StringTemplatePipe
  ) { }

  ngAfterViewInit(): void {
    WaitObservable(() => !this.emojiListItem?.nativeElement || !this.emojiListToggleButton?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => ({ listElm: this.emojiListItem.nativeElement, buttonElm: this.emojiListToggleButton.nativeElement })),
        concatMap(() => fromEvent(document, "click"), (data, event) => ({ ...data, target: event.target as HTMLElement })),
        filter(() => this.showEmojiList),
        filter(({ listElm, buttonElm, target }) => !CompareElementByElement(target, listElm) && !CompareElementByElement(target, buttonElm))
      )
      .subscribe(() => this.onCloseEmojiList());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Потеря фокуса
  onBlur(): void {
    this.lastPosition = this.getRangePosition();
  }

  // Открыть список смайликов
  onOpenEmojiList(): void {
    this.showEmojiList = true;
    this.changeDetectorRef.detectChanges();
  }

  // Закрыть список смайликов
  onCloseEmojiList(): void {
    this.showEmojiList = false;
    this.changeDetectorRef.detectChanges();
  }

  // Открыть список смайликов
  onToggleEmojilist(): void {
    if (this.showEmojiList) {
      this.onCloseEmojiList();
    }
    // Открыть
    else {
      this.onOpenEmojiList();
    }
  }

  // Выбран смайлик
  onEmojiSelect(event: EmojiEvent): void {
    if (!!this.editor && !!event.emoji && !!this.smileElm) {
      this.insertContent(this.getSmileNode(event.emoji));
    }
  }





  // Замена смайликов
  private editorEmojiReplace(editor: HTMLElement): void {
    const emojiNodes: Element[] = Array.from(editor.getElementsByClassName(this.emojiClassName));
    // Замена смайликов
    emojiNodes.forEach(node => {
      const text: string = editor.innerHTML;
      const nodeText: string = node.outerHTML;
      const emojiCode: string = "[emoji=" + node.getAttribute("data-emoji-id") + "]";
      // Замена текста
      editor.innerHTML = text.replace(nodeText, emojiCode);
    });
  }

  // Замена div'ов
  private editorBlockReplace(editor: HTMLElement): void {
    const tags: string[] = ["div", "p"];
    // Цикл по тегам
    tags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, true)));
  }

  // Замена div'ов
  private editorInlineReplace(editor: HTMLElement): void {
    const tags: string[] = ["span", "i", "b", "u", "bold", "strong", "italic"];
    // Цикл по тегам
    tags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, false)));
  }

  // Убрать обертку элемента
  private editorTagRemove(editor: HTMLElement, node: Element, br: boolean = false): void {
    const nodeText: string = node.outerHTML;
    const text: string = editor.innerHTML;
    const tagCode: string = (br ? "[br]" : "") + node.innerHTML;
    // Замена текста
    editor.innerHTML = text.replace(nodeText, tagCode);
  }

  // Интерполяция тегов
  private editorTagInterpolate(editor: HTMLElement): void {
    const regExp: RegExp = new RegExp("(\\[([a-z0-9\-_]+(=[a-z0-9\-_]+)?)+\\])+?", "ig");
    // Интерполяция
    editor.innerHTML = editor.innerHTML.replace(regExp, "\\[$2\\]");
  }

  // Замена пробелов
  private editorSpacingReplace(editor: HTMLElement): void {
    editor.innerHTML = editor.innerHTML.replace(new RegExp("(\&nbsp;+)", "ig"), " ");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("<br([\s\/]*)?>", "ig"), "[br]");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("(\\[br\\])+", "ig"), "[br]");
  }
}





// Позиция каретки в поле
interface CaretPosition {
  range: Range;
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
