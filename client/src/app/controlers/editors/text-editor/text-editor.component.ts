import { WaitObservable } from "@_datas/api";
import { CreateArray } from "@_datas/app";
import { FullModeBlockRemoveTags, FullModeInlineRemoveTags, FullModeSaveTags } from "@_datas/text";
import { ElementParentsArray, GetTextNodes, TreeWalkerToArray } from "@_helpers/app";
import { ParseInt } from "@_helpers/math";
import { TextMessage } from "@_helpers/text-message";
import { SimpleObject } from "@_models/app";
import { CaretPosition } from "@_models/text";
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Optional, Output, Self, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { Subject, concatMap, delay, filter, map, pairwise, startWith, takeUntil, tap, timer } from "rxjs";





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

  private emptySymbol: string = "\u200B";

  emojiClassName: string = "emoji-elm";
  controlTitleItterator: number[] = ControlTitleItterator;
  private titleTags: SearchAndReplaceNode[] = TitleTags;

  editingText: SafeHtml = "";
  caretElements: HTMLElement[] = [];

  private destroyed$: Subject<void> = new Subject();





  // Получить текущий курсор
  private getRangePosition(forceFocus: boolean = false): CaretPosition {
    const editor: HTMLElement = this.editor?.nativeElement;
    let start: number = 0;
    let end: number = 0;
    let selection: Selection;
    let range: Range;
    // Поиск позиции
    if (!!editor) {
      if (editor !== document.activeElement && forceFocus) {
        editor.focus();
      }
      // Параметры
      selection = document.getSelection();
      // Запомнить значения
      if (!!selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
        start = range.startOffset;
        end = range.endOffset;
      }
    }
    // Вернуть позиции
    return { start, end, range, selection };
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
      const range = position.range;
      const treeWalker: TreeWalker = document.createTreeWalker(editorElement, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node: Node) => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      // Поиск по элементам
      while (treeWalker.nextNode()) {
        const node: HTMLElement = treeWalker.currentNode as HTMLElement;
        // Исключить редактор
        if (node !== editorElement) {
          elements.push(node);
        }
      }
    }
    // Вернуть список
    return elements;
  }

  // Курсор внутри заголовка
  isCaretInTitle(level: number): boolean {
    return this.isCaretInElm(this.titleTags?.find(({ tag }) => tag === "h" + level)?.tag);
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
    return this.isCaretInElm(...BoldTags.map(({ tag }) => tag));
  }

  // Курсор внутри наклона
  get isCaretInItalic(): boolean {
    return this.isCaretInElm(...ItalicTags.map(({ tag }) => tag));
  }

  // Курсор внутри подчеркивания
  get isCaretInUnderLine(): boolean {
    return this.isCaretInElm(...UnderLineTags.map(({ tag }) => tag));
  }

  // Курсор внутри подчеркивания
  get isCaretInStrikeThrough(): boolean {
    return this.isCaretInElm(...StrikeThroughTags.map(({ tag }) => tag));
  }

  // Курсор внутри элемента по выбору
  private isCaretInElm(...tags: string[]): boolean {
    tags = tags.map(tag => tag?.toUpperCase());
    // Вернуть проверку
    return !!this.caretElements?.length && !!tags?.length && this.caretElements.some(elm => tags.includes(elm.tagName?.toUpperCase()));
  }

  // Текстовый узел
  private isTextNode(node: Node, checkTags: boolean = false) {
    const tagName: string = (node as HTMLElement)?.tagName ?? "";
    const nodeSetting: SearchAndReplaceNode = AllTags.find(({ tag }) => tag === tagName);
    // Результат проверки
    return node?.nodeType === Node.TEXT_NODE || (checkTags && !!nodeSetting && !nodeSetting?.isBlock);
  }

  // Проверка элемента условию
  private filterElement(params: SearchAndReplaceNode, element: HTMLElement): boolean {
    if (!!element && !this.isTextNode(element) && element.nodeType !== Node.COMMENT_NODE && !!this.editor?.nativeElement && element !== this.editor.nativeElement) {
      if (element.tagName.toLowerCase() === params.tag.toLowerCase()) {
        if (!params?.class || (!!params?.class && !element.classList.contains(params.class))) {
          let checkAttr: boolean = true;
          // Проверка атрибутов
          if (!!params?.attrs) {
            Object.entries(params.attrs).forEach(([key, value]) => {
              const attrValue: string = element.getAttribute(key);
              // Проверка атрибута
              checkAttr = value === "" && attrValue !== "" ?
                false : attrValue !== value ?
                  false :
                  checkAttr;
            });
          }
          // Результат проверки
          return checkAttr;
        }
      }
    }
    // Элемент не соответствует
    return false;
  }

  // Создать элемент по условию
  private createElement(params: SearchAndReplaceNode): HTMLElement {
    const element: HTMLElement = document.createElement(params.tag);
    // Добавить класс
    if (!!params?.class) {
      element.classList.add(params.class);
    }
    // Добавить атрибуты
    if (!!params?.attrs) {
      Object.entries(params.attrs).forEach(([key, value]) => !!value || value === "" ?
        element.setAttribute(key, value) :
        element.removeAttribute(key)
      );
    }
    // Создать текстовый узел
    element.appendChild(document.createTextNode(this.emptySymbol));
    // Вернуть элемент
    return element;
  }

  // Создать выделение
  private createRange(startElm: HTMLElement | Node, endElm: HTMLElement | Node, startPosition: number, endPosition: number): Range {
    const newRange: Range = document.createRange();
    // Установить параметры
    newRange.setStart(startElm, startPosition);
    newRange.setEnd(endElm, endPosition);
    // Вернуть выделение
    return newRange;
  }

  // Проверка длины содержимого
  private containsSelectableContent(fragment: DocumentFragment): boolean {
    const tags: string[] = ["img"];
    const isNodeSelectable = (node: Node): boolean => {
      if (this.isTextNode(node) && !!node.textContent) {
        return true;
      }
      // Проверка для элемента <img>
      else if (node.nodeType === Node.ELEMENT_NODE && tags.some(tag => tag?.toLowerCase() === (node as HTMLElement).tagName?.toLowerCase())) {
        return true;
      }
      // Рекурсивный обход дочерних узлов
      for (let i = 0; i < node.childNodes.length; i++) {
        return isNodeSelectable(node.childNodes[i]);
      }
      // Ничего нет
      return false;
    }
    // Проверка
    return isNodeSelectable(fragment);
  }

  // Элемент содержит потомков
  private isNodeHasChild(node: Node, noHasChildAvail: string[] = []): boolean {
    if (!!node && node.nodeType !== Node.COMMENT_NODE) {
      if (this.isTextNode(node)) {
        return !!node.textContent.replace(this.emptySymbol, "").replace(new RegExp("([\\s\\n\\r\\t]+)", "ui"), "")?.length;
      }
      // Исключения
      else if (noHasChildAvail.includes(node.nodeName.toLowerCase())) {
        return true;
      }
      // Сканировать потомков
      else if (!!node.childNodes?.length) {
        return Array.from(node.childNodes).reduce((o, childNode) => o || this.isNodeHasChild(childNode, noHasChildAvail), false);
      }
    }
    // Нет потомков
    return false;
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
        filter(text => text !== this.htmlToText(this.editor?.nativeElement?.innerHTML)),
        tap(text => {
          this.editingText = this.textTransform(text ?? "", true);
          // Обновить
          this.changeDetectorRef.detectChanges();
        }),
        delay(1)
      )
      .subscribe(() => this.onEdit(null));
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
      .subscribe(() => this.updateStates());
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
      // Предыдущий узел
      const getBeforeNode = (node: Node) => {
        if (node !== editor) {
          if (!!node?.previousSibling) {
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
        if (!!testChildren?.length && testChildren.every(child => child.nodeName.toLowerCase() === "br") && !noRemoveNode.includes(node) && noRemoveBeforeNode !== node) {
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
          if (testChildren?.every(child => !this.isNodeHasChild(child)) && !noRemoveNode.includes(node) && noRemoveBeforeNode !== node) {
            node.remove();
          }
        }
      };
      // Параметры
      const ignoreKeys: string[] = ["Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      const editor: HTMLElement = this.editor.nativeElement;
      const clearIgnore: string[] = ["#text", "br", "img"];
      const noHasChildAvail: string[] = ["img"];
      const { selection } = this.getRangePosition();
      const key: string = event?.["key"] ?? "";
      const keyEnter: boolean = !!key && ignoreKeys.includes(key);
      const firstChild: Node = editor.childNodes[0] ?? null;
      const noRemoveNode: Node[] = keyEnter ? ElementParentsArray(selection.anchorNode, this.editor.nativeElement, true) : [];
      const hasChild: boolean = noRemoveNode.reduce((o, node) => o || this.isNodeHasChild(node, noHasChildAvail), false);
      const noRemoveBeforeNode: Node = !!noRemoveNode && !!firstChild && noRemoveNode.some(node => getBeforeNode(node) === firstChild) && hasChild ?
        firstChild :
        null;
      // Начать очистку
      this.wrapTextNodes();
      removeEmptyBr(editor);
      clearChild(editor, false);
      // Сохранить
      this.onSave();
      // Обновить
      this.changeDetectorRef.detectChanges();
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

  // Сделать жирным
  onToggleBold(): void {
    this.onToggleTags(BoldTags);
  }

  // Сделать курсивом
  onToggleItalic(): void {
    this.onToggleTags(ItalicTags);
  }

  // Сделать подчеркнутым
  onToggleUnderLine(): void {
    this.onToggleTags(UnderLineTags);
  }

  // Сделать зачеркнутым
  onToggleStrikeThrough(): void {
    this.onToggleTags(StrikeThroughTags);
  }

  // Назначить заголовком
  onToggleTitle(level: number): void {
    const currentLevel: number = this.controlTitleItterator.reduce((o, i) => this.isCaretInTitle(i) ? i : o, -1);
    // Удалить заголовки
    if (currentLevel > 0) {
      this.onToggleTags(this.titleTags, false);
      this.wrapTextNodes();
      this.editor.nativeElement.normalize();
    }
    // Сделать заголовком
    if (currentLevel !== level) {
      this.onToggleTags(ParagraphTags, false);
      this.onToggleTags(this.titleTags.filter(({ tag }) => tag === "h" + level));
    }
  }

  // Обновить теги
  private onToggleTags(tags: SearchAndReplaceNode[], forceOperation: boolean | null = null): void {
    if (!!tags?.length) {
      const hasTag: boolean = this.isCaretInElm(...tags.map(({ tag }) => tag));
      // Удалить тег
      if (hasTag || forceOperation === false) {
        tags.forEach(tag => this.searchAndReplaceNode(tag, false));
      }
      // Добавить тег
      else if (!hasTag || !!forceOperation) {
        this.searchAndReplaceNode(tags[0], true);
      }
      // Обновить
      this.onSave();
      this.updateStates();
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

  // Замена блочных элементов
  // ? Добавляет абзац
  private editorBlockReplace(editor: HTMLElement): void {
    FullModeBlockRemoveTags.forEach(tag => Array
      .from(editor.getElementsByTagName(tag))
      .forEach(node => this.editorTagRemove(editor, node, true))
    );
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

  // Поиск элементов по параметрам
  private searchAndReplaceNode(params: SearchAndReplaceNode, isAdd: boolean = true): void {
    const { selection, range } = this.getRangePosition();
    const parentElement: Node = range.commonAncestorContainer;
    const treeWalker: TreeWalker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ALL, {
      acceptNode: (node: Node) => range.intersectsNode(node) ?
        NodeFilter.FILTER_ACCEPT :
        NodeFilter.FILTER_REJECT
    });
    // Добавить
    if (isAdd) {
      const newElm: HTMLElement = this.createElement(params);
      // Каретка
      if (range.collapsed) {
        const currentNode: Node = range.startContainer;
        // Текстовый узел
        if (this.isTextNode(currentNode)) {
          const wordsRegExp: RegExp = new RegExp("[а-яёЁ\\w\\d\\-_]", "ui");
          const textContent: string = (currentNode as Text).textContent ?? "";
          const position: number = range.startOffset;
          const isLeftPartOfWord: boolean = position > 0 && wordsRegExp.test(textContent[position - 1]);
          const isRightPartOfWord: boolean = position < textContent.length && wordsRegExp.test(textContent[position]);
          // Выделение внутри слова
          if (isLeftPartOfWord && isRightPartOfWord) {
            let start: number = position;
            let end: number = position;
            // Поиск начала слова
            while (start > 0 && wordsRegExp.test(textContent[start - 1])) {
              start--;
            }
            // Поиск конца слова
            while (end < textContent.length && wordsRegExp.test(textContent[end])) {
              end++;
            }
            // Выделение слова и оборачивание
            range.setStart(currentNode, start);
            range.setEnd(currentNode, end);
            range.surroundContents(newElm);
            // Вернуть каретку обратно
            selection.removeAllRanges();
            selection.addRange(this.createRange(newElm.firstChild, newElm.firstChild, position - start, position - start));
          }
          // Вне слов
          else {
            const newRange: Range = this.createRange(newElm.firstChild, newElm.firstChild, 0, (newElm.firstChild as Text).length);
            // Установить позицию
            newRange.collapse(false);
            range.insertNode(newElm);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
      // Выделение
      else {
        const startContainer: Node = range.startContainer;
        const startOffset: number = range.startOffset;
        const endContainer: Node = range.endContainer;
        const endOffset: number = range.endOffset;
        let firstInsered: Node;
        let lastInsered: Node;
        // Перенос текста
        const handleTextWrap = (node: Node): void => {
          const wrapper: HTMLElement = newElm.cloneNode() as HTMLElement;
          const text: Text = node as Text;
          const wrapStart: number = node === startContainer ? startOffset : 0;
          const wrapEnd = node === endContainer ? endOffset : text.length;
          const textToWrap: Text = text.splitText(wrapStart);
          // Обработка
          textToWrap.splitText(wrapEnd - wrapStart);
          wrapper.appendChild(textToWrap.cloneNode(true));
          text.parentNode.replaceChild(wrapper, textToWrap);
          firstInsered = firstInsered ?? wrapper;
          lastInsered = wrapper ?? lastInsered;
        };
        // Обработать всех потомков
        TreeWalkerToArray(treeWalker, range)
          .filter(node => this.isTextNode(node) && !this.filterElement(params, node.parentNode as HTMLElement))
          .forEach(node => handleTextWrap(node));
        // Обновить выделение
        if (!!firstInsered?.firstChild && !!lastInsered?.firstChild) {
          const lastSize: number = ParseInt((lastInsered?.firstChild as Text)?.length);
          const newRange: Range = this.createRange(firstInsered?.firstChild, lastInsered?.firstChild, 0, lastSize);
          // Обновить выделение
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
    // Удалить
    else {
      if (range.collapsed) {
        const currentNode: Node = range.startContainer;
        // Текстовый узел
        if (this.isTextNode(currentNode)) {
          const wordsRegExp: RegExp = new RegExp("[а-яёЁ\\w\\d\\-_]", "ui");
          const textContent: string = (currentNode as Text).textContent ?? "";
          const position: number = range.startOffset;
          const isLeftPartOfWord: boolean = position > 0 && wordsRegExp.test(textContent[position - 1]);
          const isRightPartOfWord: boolean = position < textContent.length && wordsRegExp.test(textContent[position]);
          // Выделение внутри слова
          if (isLeftPartOfWord && isRightPartOfWord && this.filterElement(params, currentNode.parentNode as HTMLElement) && !params?.removeAllTag) {
            let start: number = position;
            let end: number = position;
            // Поиск начала слова
            while (start > 0 && wordsRegExp.test(textContent[start - 1])) {
              start--;
            }
            // Поиск конца слова
            while (end < textContent.length && wordsRegExp.test(textContent[end])) {
              end++;
            }
            // Выделение слова и удаление
            range.setStart(currentNode, start);
            range.setEnd(currentNode, end);
            // Удаление элемента
            let newElm: Node = this.partialUnwrapElement(currentNode.parentNode, range);
            // Вернуть каретку обратно
            newElm = this.isTextNode(newElm) ? newElm : newElm.firstChild;
            selection.removeAllRanges();
            selection.addRange(this.createRange(newElm, newElm, position - start, position - start));
          }
          // Вне слов
          else {
            ElementParentsArray(parentElement, this.editor.nativeElement, true)
              .filter(currentNode => this.filterElement(params, currentNode as HTMLElement))
              .forEach(currentNode => {
                const position: number = range.startOffset;
                const newNode: Node = this.unwrapElement(currentNode as HTMLElement);
                const parentNode: Node = newNode.parentNode;
                const newRange: Range = this.createRange(newNode, newNode, position, position);
                // Восстановить позицию
                selection.removeAllRanges();
                selection.addRange(newRange);
                // Объединить все текстовые узлы
                this.normalizeTextNodes(parentNode);
              });
          }
        }
      }
      // Выделение
      else {
        const nodes: Node[] = TreeWalkerToArray(treeWalker, range);
        const nodeSize: number = nodes.length;
        let startPosition: number = range.startOffset;
        let endPosition: number = range.endOffset;
        let startRemoved: Node = range.startContainer;
        let endRemoved: Node = range.endContainer;
        // Обход элементов
        nodes
          .map((node, key) => ({ node, key }))
          .filter(({ node }) => node !== this.editor?.nativeElement)
          .map(data => ({ ...data, parents: ElementParentsArray(data.node, this.editor?.nativeElement, true) }))
          .forEach(({ key, parents }) => parents.forEach((node, subKey) => {
            if (this.filterElement(params, node as HTMLElement)) {
              const updatedElm: Node = this.partialUnwrapElement(node, range);
              // Первый элемент
              if (key === 0) {
                startRemoved = GetTextNodes(updatedElm)[0];
                startPosition = 0;
              }
              // Последний элемент
              if (key + 1 === nodeSize) {
                endRemoved = GetTextNodes(updatedElm)[0];
                endPosition = endRemoved.textContent.length;
              }
            }
          }));
        // Обновить выделение
        if (!!startRemoved && !!endRemoved) {
          const newRange: Range = this.createRange(startRemoved, endRemoved, startPosition, endPosition);
          // Обновить выделение
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        // Нормализация
        this.normalizeTextNodes(parentElement);
      }
    }
  }

  // Удалить тег, сохранив содержимое
  private unwrapElement(element: HTMLElement): Node {
    const parentNode: ParentNode = element.parentNode;
    // Перемещение
    while (element.firstChild) {
      parentNode?.insertBefore(element.firstChild, element);
    }
    // Новый элемент
    const newNode: Node = element.previousSibling;
    // Удалить
    parentNode?.removeChild(element);
    // Вернуть элемент
    return newNode;
  }

  // Удалить фрагмент частично, сохранив содержимое
  private partialUnwrapElement(element: Node, range: Range): Node {
    if (element instanceof HTMLElement) {
      const startOutside: boolean = range.isPointInRange(element, 0);
      const endOutside: boolean = range.isPointInRange(element, element.childNodes.length);
      let newElm: Node;
      // Выделение полностью вокруг элемента
      if (startOutside && endOutside) {
        newElm = this.unwrapElement(element);
      }
      // Выделение начинается до элемента и заканчивается внутри элемента
      else if (startOutside && !endOutside) {
        const newRange: Range = this.createRange(element, range.endContainer, 0, range.endOffset);
        const contentToMove: DocumentFragment = newRange.extractContents();
        // Перенести
        element.parentNode.insertBefore(contentToMove, element);
        newElm = element.previousSibling;
      }
      // Выделение начинается внутри элемента и заканчивается после элемента
      else if (!startOutside && endOutside) {
        const newRange: Range = this.createRange(range.startContainer, element, range.startOffset, element.childNodes.length);
        const contentToMove: DocumentFragment = newRange.extractContents();
        // Перенести
        element.parentNode.insertBefore(contentToMove, element.nextSibling);
        newElm = element.nextSibling;
      }
      // Выделение полностью внутри элемента
      else if (!startOutside && !endOutside) {
        const beforeSelectionElement: HTMLElement = element.cloneNode(false) as HTMLElement;
        const afterSelectionElement: HTMLElement = element.cloneNode(false) as HTMLElement;
        const beforeSelectionRange: Range = this.createRange(element, range.startContainer, 0, range.startOffset);
        const afterSelectionRange: Range = this.createRange(range.endContainer, element, range.endOffset, element.childNodes.length);
        const beforeSelectionContent: DocumentFragment = beforeSelectionRange.extractContents();
        const afterSelectionContent: DocumentFragment = afterSelectionRange.extractContents();
        // Перенести содержимое спереди
        if (this.containsSelectableContent(beforeSelectionContent)) {
          beforeSelectionElement.appendChild(beforeSelectionContent);
          element.parentNode.insertBefore(beforeSelectionElement, element);
        }
        // Перенести содержимое позади
        if (this.containsSelectableContent(afterSelectionContent)) {
          afterSelectionElement.appendChild(afterSelectionContent);
          element.parentNode.insertBefore(afterSelectionElement, element.nextSibling);
        }
        // Очистить от тега сам элемент
        newElm = this.unwrapElement(element);
      }
      // Удалить элемент
      if (!this.isNodeHasChild(element)) {
        element.remove();
      }
      // Обновленный элемент
      return newElm;
    }
    // Ничего не поменялось
    return element;
  }

  // Объединить все текстовые узлы
  private normalizeTextNodes(container: Node): void {
    if (container.nodeType === Node.ELEMENT_NODE) {
      (container as HTMLElement).normalize();
    }
    // Рекурсивно обходим дочерние узлы
    for (let i = 0; i < container.childNodes.length; i++) {
      this.normalizeTextNodes(container.childNodes[i]);
    }
  }

  // Установить состояния кнопок
  private updateStates(): void {
    this.caretElements = this.getCaretElementsTree;
    this.changeDetectorRef.detectChanges();
  }

  // Обернуть текстовые узлы в абзацы
  private wrapTextNodes(): void {
    if (!!this.editor?.nativeElement) {
      let { selection, range: { startOffset, endOffset, startContainer, endContainer } } = this.getRangePosition(true);
      const parentNode: Node = this.editor.nativeElement;
      // Нормализация
      this.editor.nativeElement.normalize();
      // Поиск узлов
      Array.from(this.editor.nativeElement.childNodes)
        .filter(node => this.isTextNode(node, true))
        .filter(node => this.isNodeHasChild(node))
        .forEach(node => {
          const newElm: HTMLElement = this.createElement(ParagraphTags[0]);
          const previousNode: HTMLElement = node?.previousSibling as HTMLElement;
          const nextNode: HTMLElement = node?.nextSibling as HTMLElement;
          const previousNodeIsP: boolean = previousNode?.tagName === "P";
          const nextNodeIsP: boolean = nextNode?.tagName === "P";
          const isStartSelected: boolean = startContainer === node;
          const isEndSelected: boolean = endContainer === node;
          // Переместить в предыдущий абзац
          if (previousNodeIsP) {
            const previousNodeTextLength: number = ParseInt(previousNode?.textContent?.length);
            // Перемещение
            previousNode.appendChild(node);
            previousNode.normalize();
            // Обновить начало
            if (isStartSelected) {
              startContainer = GetTextNodes(previousNode)[0];
              startOffset = previousNodeTextLength + startOffset;
            }
            // Обновить конец
            if (isEndSelected) {
              endContainer = GetTextNodes(previousNode)[0];
              endOffset = previousNodeTextLength + endOffset;
            }
            // Обновить ссылку на узел
            node = previousNode;
          }
          // Обернуть в абзац
          else {
            parentNode.insertBefore(newElm, node);
            newElm.appendChild(node);
            newElm.normalize();
            // Обновить ссылку на узел
            node = newElm;
          }
          // Соеденить со следующим абзацем
          if (nextNodeIsP) {
            Array.from(nextNode.childNodes).forEach(n => node.appendChild(n));
            nextNode.remove();
          }
          // Обновить выделение
          selection.removeAllRanges();
          selection.addRange(this.createRange(startContainer, endContainer, startOffset, endOffset));
        });
    }
  }
}





// Интерфейс для поиска и замены тегов
interface SearchAndReplaceNode {
  tag: string;
  isBlock?: boolean;
  class?: string;
  attrs?: SimpleObject;
  removeAllTag?: boolean;
}

// Интерфейс визуального выделения
interface VisualSelection {
  node: Node;
  offset: number;
}





// Цикл по допустимым уровням заголовкам
const ControlTitleItterator: number[] = CreateArray(5).map(i => i + 2);

// Параграфы
const ParagraphTags: SearchAndReplaceNode[] = [
  { tag: "p", isBlock: true }
];

// Теги заголовков
const TitleTags: SearchAndReplaceNode[] = CreateArray(ControlTitleItterator.length + ControlTitleItterator[0])
  .map(i => i > 0 ? "h" + i : "")
  .filter(tag => !!tag)
  .map(tag => ({
    tag,
    isBlock: true,
    removeAllTag: true
  }));

// Жирные теги
const BoldTags: SearchAndReplaceNode[] = [
  { tag: "b" },
  { tag: "strong" }
];

// Наклонные теги
const ItalicTags: SearchAndReplaceNode[] = [
  { tag: "i" },
  { tag: "em" }
];

// Подчеркнутые теги
const UnderLineTags: SearchAndReplaceNode[] = [
  { tag: "u" }
];

// Зачеркнутые теги
const StrikeThroughTags: SearchAndReplaceNode[] = [
  { tag: "s" },
  { tag: "del" }
];

// Перечисление всех тегов
const AllTags: SearchAndReplaceNode[] = [
  ...ParagraphTags,
  ...TitleTags,
  ...BoldTags,
  ...ItalicTags,
  ...UnderLineTags,
  ...StrikeThroughTags
];
