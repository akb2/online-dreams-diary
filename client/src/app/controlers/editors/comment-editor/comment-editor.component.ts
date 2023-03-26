import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { EmojiData, EmojiEvent, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { WaitObservable } from "@_datas/api";
import { CompareElementByElement } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { MultiObject, SimpleObject } from "@_models/app";
import { Comment, CommentMaterialType } from "@_models/comment";
import { StringTemplatePipe } from "@_pipes/string-template-pipe";
import { CommentService } from "@_services/comment.service";
import { concatMap, filter, fromEvent, map, Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-comment-editor",
  templateUrl: "./comment-editor.component.html",
  styleUrls: ["./comment-editor.component.scss"],
  host: {
    "[class.wrap-controls]": "wrapControlsClass"
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentEditorComponent implements AfterViewInit, OnChanges, OnDestroy {


  @HostBinding("class.wrap-controls") wrapControlsClass: boolean = false;

  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() materialOwner: number;
  @Input() placeholder: string = "Напишите, что вы об этом думаете . . .";
  @Input() wrapControls: boolean = false;
  @Input() bottomSmiles: boolean = false;

  @Output() onSuccessSend: EventEmitter<string> = new EventEmitter();

  @ViewChild("editor", { read: ElementRef }) editor: ElementRef<HTMLElement>;
  @ViewChild("smile") smileElm: TemplateRef<any>;
  @ViewChild("emojiListItem", { read: ElementRef }) emojiListItem: ElementRef<HTMLElement>;
  @ViewChild("emojiListToggleButton", { read: ElementRef }) emojiListToggleButton: ElementRef<HTMLElement>;

  private lastPosition: CaretPosition;
  private smileSize: number = 24;

  showEmojiList: boolean = false;
  i18nEmoji: MultiObject<string> = I18nEmoji;
  emojiClassName: string = "emoji-elm";

  sendLoader: boolean = false;

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
  private insertContent(content: string | Node, event: Event, setSelectionIntoNode: boolean = false): void {
    if (!this.lastPosition) {
      this.lastPosition = this.getRangePosition(true);
    }
    // Убрать контент
    this.lastPosition.range.deleteContents();
    // Вставить текст
    if (typeof content === "string") {
      this.lastPosition.range.insertNode(document.createTextNode(content));
    }
    // Вставить HTML
    else {
      this.lastPosition.range.insertNode(content);
    }
    // Убрать выделение
    this.lastPosition.range.collapse();
    this.onEdit(event);
  }

  // Получить шаблон смайлика
  private getSmileNode(mixedEmoji: string | EmojiData): Element {
    const emoji: EmojiData = typeof mixedEmoji === "string" ? this.emojiService.getData(mixedEmoji) : mixedEmoji;
    const styles: SimpleObject = this.smileStyles(emoji);
    const id: string = emoji.id;
    const alt: string = emoji.name;
    const skin: number = emoji?.skinTone ?? 1;
    const set: string = emoji?.set ?? "";
    const content: string = this.stringTemplatePipe.transform(this.smileElm, { styles, id, alt, skin, set });
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

  // Состояние кнопки отправить
  get sendIsAvail(): boolean {
    return !!this.getEditorValue;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private emojiService: EmojiService,
    private stringTemplatePipe: StringTemplatePipe,
    private commentService: CommentService
  ) { }

  ngOnChanges(): void {
    this.wrapControlsClass = this.wrapControls;
  }

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

  // Ввод
  onEdit(event: Event): void {
    if (!!this.editor?.nativeElement) {
      // Проверка дочерних элементов
      const hasChildNodes = (node: Node) => !!node ? (node.nodeName.toLowerCase() === "#text" ?
        !!node.textContent :
        !!node.childNodes?.length || noHasChildAvail.includes(node.nodeName.toLowerCase())) :
        false;
      // Предыдущий узел
      const getBeforeNode = (node: Node) => {
        if (node !== editor) {
          if (!!node.previousSibling) {
            return node.previousSibling;
          }
          // Поиск по родителям
          else {
            let tempNode: Node = node;
            // Поиск
            while (!!tempNode.parentElement && tempNode !== editor) {
              tempNode = tempNode.parentElement;
              // Элемент найден
              if (!!tempNode.previousSibling) {
                return tempNode.previousSibling;
              }
            }
          }
        }
        // Нет предыдущего элемента
        return null;
      };
      // Очистка переносов
      const removeEmptyBr = (node: ChildNode) => {
        const children: ChildNode[] = Array.from(node.childNodes);
        // Очистка дочерних
        children.forEach(child => removeEmptyBr(child));
        // Проверка
        const testChildren: ChildNode[] = Array.from(node.childNodes);
        // Удалить пустые переносы
        if (!!testChildren?.length && testChildren.every(child => child.nodeName.toLowerCase() === "br") && noRemoveNode !== node && noRemoveBeforeNode !== node) {
          testChildren.forEach(child => child.remove());
        }
      };
      // Функция поиска и очистки
      const clearChild = (node: ChildNode, clearNode: boolean) => {
        const children: ChildNode[] = Array.from(node.childNodes);
        const nodeName: string = node.nodeName.toLowerCase();
        // Очистка дочерних
        children.forEach(child => clearChild(child, true));
        // Очистка текущего элемента
        if (clearNode && !clearIgnore.includes(nodeName)) {
          const testChildren: ChildNode[] = Array.from(node.childNodes);
          // Удалить если нет дочерних элементов
          if (testChildren?.every(child => !hasChildNodes(child)) && noRemoveNode !== node && noRemoveBeforeNode !== node) {
            node.remove();
          }
        }
      };
      // Параметры
      const ignoreKeys: string[] = ["Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      const editor: HTMLElement = this.editor.nativeElement;
      const clearIgnore: string[] = ["#text", "br", "img"];
      const noHasChildAvail: string[] = ["img"];
      const selection: Selection = document.getSelection();
      const keyEnter: boolean = !!event["key"] && ignoreKeys.includes(event["key"]);
      const firstChild: Node = editor.childNodes[0] ?? null;
      const noRemoveNode: Node = keyEnter ? selection.anchorNode : null;
      const noRemoveBeforeNode: Node = !!noRemoveNode && !!firstChild && getBeforeNode(noRemoveNode) === firstChild && hasChildNodes(noRemoveNode) ?
        firstChild : null;
      // Начать очистку
      removeEmptyBr(editor);
      clearChild(editor, false);
    }
  }

  // Вставка из буффера
  onPaste(event: ClipboardEvent): void {
    const text: string = event.clipboardData.getData("text/plain");
    // Вставка текста
    event.preventDefault();
    document.execCommand("insertHTML", false, text);
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
      this.insertContent(this.getSmileNode(event.emoji), event.$event);
    }
  }

  // Отправка комментария
  onSend(event: Event): void {
    if (this.sendIsAvail && !this.sendLoader) {
      this.onEdit(event);
      // Параметры
      const text: string = this.getEditorValue;
      const data: Partial<Comment> = {
        materialType: this.materialType,
        materialId: this.materialId,
        materialOwner: this.materialOwner,
        text
      };
      // Проверка текста
      if (!!text) {
        this.sendLoader = true;
        this.changeDetectorRef.detectChanges();
        // Отправка
        this.commentService.send(data)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(
            () => {
              const editor: HTMLElement = this.editor?.nativeElement;
              // Очистить редактор
              if (!!editor) {
                editor.innerHTML = "";
              }
              // Обновить
              this.sendLoader = false;
              this.changeDetectorRef.detectChanges();
            },
            () => {
              this.sendLoader = false;
              this.changeDetectorRef.detectChanges();
            }
          );
      }
    }
  }

  // Перенос строки
  onCheckEnterKey(event: KeyboardEvent): void {
    const keys: string[] = ["Enter", "NumpadEnter"];
    // Нажатия на Enter
    if (keys.includes(event.key)) {
      if (event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        // Отправка сообщения
        this.onSend(event);
      }
    }
  }





  // Замена смайликов
  private editorEmojiReplace(editor: HTMLElement): void {
    const emojiNodes: Element[] = Array.from(editor.getElementsByClassName(this.emojiClassName));
    // Замена смайликов
    emojiNodes.forEach(node => {
      const text: string = editor.innerHTML;
      const nodeText: string = node.outerHTML;
      const id: string = node.getAttribute("data-emoji-id");
      const set: string = node.getAttribute("data-emoji-set");
      const skin: number = ParseInt(node.getAttribute("data-emoji-skin"), 1);
      const emojiCode: string = "[emoji=" + id + (skin > 1 ? ":" + skin : "") + (!!set ? ":" + set : "") + "]";
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
    const brTag: string = br ? "[br]" : "";
    const tagCode: string = brTag + node.innerHTML + brTag;
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
    editor.innerHTML = editor.innerHTML.replace(new RegExp("<br([\\s\/]*)?>", "ig"), "[br]");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("(\\[br\\])+", "ig"), "[br]");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("^\\[br\\]", "i"), "");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("\\[br\\]$", "i"), "");
    editor.innerHTML = editor.innerHTML.replace(new RegExp("([\\s\\n\\r\\t])+", "ig"), " ");
    editor.innerHTML = editor.innerHTML.trim();
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
