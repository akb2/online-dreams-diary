import { WaitObservable } from "@_datas/api";
import { CreateArray } from "@_datas/app";
import { FullModeBlockRemoveTags, FullModeInlineRemoveTags, FullModeSaveTags } from "@_datas/text";
import { ParseInt } from "@_helpers/math";
import { TextMessage } from "@_helpers/text-message";
import { CaretPosition } from "@_models/text";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Optional, Output, Self, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { Subject, concatMap, filter, map, pairwise, startWith, takeUntil, timer } from "rxjs";





@Component({
  selector: "app-text-editor",
  templateUrl: "./text-editor.component.html",
  styleUrls: ["./text-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TextEditorComponent extends TextMessage implements OnInit, AfterViewChecked, OnDestroy {

  @Output() acceptEvent: EventEmitter<void> = new EventEmitter();

  @ViewChild("editor", { read: ElementRef }) editor: ElementRef<HTMLElement>;

  private firstLaunch: boolean = true;
  private lastPosition: CaretPosition;

  emojiClassName: string = "emoji-elm";
  controlTitleItterator: number[] = CreateArray(5).map(i => i + 2);

  editingText: SafeHtml = "";
  caretElements: HTMLElement[] = [];

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
      // Параметры
      const selection: Selection = document.getSelection();
      // Запомнить значения
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
        start = range.startOffset;
        end = range.endOffset;
      }
    }
    // Вернуть позиции
    return { start, end, range };
  }

  // Получить содержимое поля ввода
  get getEditorValue(): string {
    const editor: HTMLElement = this.editor?.nativeElement;
    // Редактор определен
    if (!!editor) {
      return this.htmlToText(editor.innerHTML);
    }
    // Пусто
    return "";
  }

  // Преобразовать HTML текст в обычный
  private htmlToText(text: string): string {
    const tempEditor: HTMLElement = document.createElement("div");
    // Преобразование
    tempEditor.innerHTML = text;
    // Заполнить текст
    // this.editorTagInterpolate(tempEditor);
    this.editorBlockReplace(tempEditor);
    this.editorInlineReplace(tempEditor);
    this.editorTagReplace(tempEditor);
    this.editorEmojiReplace(tempEditor);
    this.editorSpacingReplace(tempEditor);
    // Вернуть текст
    return tempEditor.innerHTML;
  }

  // Древо элементов от каретки до редактора
  private get getCaretElementsTree(): HTMLElement[] {
    const elements: HTMLElement[] = [];
    const editorElement: HTMLElement = this.editor?.nativeElement;
    // Редактор определен
    if (!!editorElement) {
      const position: CaretPosition = this.getRangePosition(true);
      let startElement: Node = position.range.startContainer;
      let endElement: Node = position.range.endContainer;
      // Если начальная позиция - текстовый узел, начнем с его родительского элемента.
      if (startElement.nodeType === Node.TEXT_NODE) {
        startElement = startElement.parentElement;
      }
      // Если конечная позиция - текстовый узел, начнем с его родительского элемента.
      if (endElement.nodeType === Node.TEXT_NODE) {
        endElement = endElement.parentElement;
      }
      // Сначала обработаем начальный узел
      while (startElement && startElement !== editorElement && startElement !== document.body) {
        elements.push(startElement as HTMLElement);
        startElement = startElement.parentElement;
      }
      // Теперь обработаем конечный узел
      while (endElement && endElement !== editorElement && endElement !== document.body && !elements.includes(endElement as HTMLElement)) {
        elements.push(endElement as HTMLElement);
        endElement = endElement.parentElement;
      }
    }
    // Массив элементов
    return elements;
  }

  // Курсор внутри заголовка
  isCaretInTitle(level: number): boolean {
    const levels: string[] = ["", "h1", "h2", "h3", "h4", "h5", "h6"];
    // Проверить
    return this.isCaretInElm(levels[level]);
  }

  // Курсор внутри одного из заголовков
  get isCaretInTitles(): boolean {
    return this.controlTitleItterator.reduce(
      (o, i) => o || this.isCaretInTitle(i),
      false
    );
  }

  // Курсор внутри жирности
  get isCaretInBold(): boolean {
    return this.isCaretInElm("b", "strong");
  }

  // Курсор внутри наклона
  get isCaretInItalic(): boolean {
    return this.isCaretInElm("i", "em");
  }

  // Курсор внутри подчеркивания
  get isCaretInUnderline(): boolean {
    return this.isCaretInElm("u");
  }

  // Курсор внутри подчеркивания
  get isCaretInStrikeThrough(): boolean {
    return this.isCaretInElm("s", "del");
  }

  // Курсор внутри элемента по выбору
  private isCaretInElm(...tags: string[]): boolean {
    tags = tags.map(tag => tag?.toUpperCase());
    // Вернуть проверку
    return !!this.caretElements?.length && !!tags?.length && this.caretElements.some(elm => tags.includes(elm.tagName?.toUpperCase()));
  }





  constructor(
    @Optional() @Self() controlDir: NgControl,
    emojiService: EmojiService,
    domSanitizer: DomSanitizer,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir, emojiService, domSanitizer);
    // Прослушивание изменений
    WaitObservable(() => !this.control)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.control.valueChanges.pipe(
          startWith(null)
        )),
        map(() => this.firstLaunch ? this.htmlToText(this.value) : this.value),
        filter(text => text !== this.htmlToText(this.editor?.nativeElement?.innerHTML))
      )
      .subscribe(text => {
        this.editingText = this.textTransform(text ?? "", true);
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnInit(): void {
    timer(0, 50)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => this.getRangePosition()),
        pairwise(),
        filter(([prev, next]) => (
          !!next && (
            prev?.start !== next?.start ||
            prev?.end !== next?.end ||
            prev?.range?.startContainer !== next?.range?.startContainer ||
            prev?.range?.endContainer !== next?.range?.endContainer
          )
        ))
      )
      .subscribe(() => {
        this.caretElements = this.getCaretElementsTree;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngAfterViewChecked(): void {
    const editor: HTMLElement = this.editor?.nativeElement;
    // Заменить текст
    if (!!editor && editor.innerHTML !== this.editingText) {
      this.onSave();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Потеря фокуса
  onBlur(): void {
    this.lastPosition = this.getRangePosition();
    // Сохранить
    this.onSave();
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
      // Сохранить
      this.onSave();
    }
  }

  // Вставка из буффера
  onPaste(event: ClipboardEvent): void {
    const text: string = event.clipboardData.getData("text/plain");
    // Вставка текста
    event.preventDefault();
    document.execCommand("insertHTML", false, text);
    // Сохранить
    this.onSave();
  }

  // Перенос строки
  onCheckEnterKey(event: KeyboardEvent): void {
    const keys: string[] = ["Enter", "NumpadEnter"];
    // Нажатия на Enter
    if (keys.includes(event.key)) {
      if (event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        // Сохранить
        this.onSave();
        // Отправка сообщения
        this.acceptEvent.emit();
      }
    }
  }

  // Сохранить значение в форму
  onSave(): void {
    if (!!this.control) {
      this.control.setValue(this.getEditorValue);
    }
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

  // Замена блочных элементов
  // ? Добавляет абзац
  private editorBlockReplace(editor: HTMLElement): void {
    FullModeBlockRemoveTags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, true)));
  }

  // Замена строчных элементов
  // ? Без добавления абзаца
  private editorInlineReplace(editor: HTMLElement): void {
    FullModeInlineRemoveTags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, false)));
  }

  // Замена HTML тегов на BB теги
  private editorTagReplace(editor: HTMLElement): void {
    FullModeSaveTags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => {
      const nodeText: string = node.outerHTML;
      const text: string = editor.innerHTML;
      const tagCode: string = "[" + tag + "]" + node.innerHTML + "[/" + tag + "]";
      // Замена текста
      editor.innerHTML = text.replace(nodeText, tagCode);
    }));
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
