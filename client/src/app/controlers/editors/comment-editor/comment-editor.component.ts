import { PopupGraffityComponent } from "@_controlers/graffity/graffity.component";
import { PopupPhotoUploaderComponent } from "@_controlers/photo-uploader/photo-uploader.component";
import { UrlParamsStringToObject } from "@_datas/api";
import { ShortModeBlockRemoveTags, ShortModeInlineRemoveTags } from "@_datas/text";
import { GetYouTubeImage, GetYouTubeLink } from "@_helpers/comment";
import { DrawDatas } from "@_helpers/draw-datas";
import { ParseInt } from "@_helpers/math";
import { ArrayMap } from "@_helpers/objects";
import { WaitObservable } from "@_helpers/rxjs";
import { AnyToString } from "@_helpers/string";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { Comment, CommentMaterialType, GraffityDrawData, YouTubeVideo, YouTubeVideoBase } from "@_models/comment";
import { MediaFile } from "@_models/media";
import { ScrollData } from "@_models/screen";
import { CaretPosition } from "@_models/text";
import { StringTemplatePipe } from "@_pipes/string-template.pipe";
import { CommentService } from "@_services/comment.service";
import { ScrollService } from "@_services/scroll.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { translateNeedPetrovichSelector } from "@app/reducers/translate";
import { EmojiData, EmojiEvent, EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { Store } from "@ngrx/store";
import { TranslateService } from "@ngx-translate/core";
import { Subject, filter, map, takeUntil } from "rxjs";



@Component({
  selector: "app-comment-editor",
  templateUrl: "./comment-editor.component.html",
  styleUrls: ["./comment-editor.component.scss"],
  host: {
    "[class.wrap-controls]": "wrapControlsClass"
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentEditorComponent implements OnChanges, OnDestroy {
  @HostBinding("class.wrap-controls") wrapControlsClass: boolean = false;

  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() materialOwner: number;
  @Input() placeholder: string = "components.comment.editor.placeholder";
  @Input() wrapControls: boolean = false;
  @Input() replyUser: User;
  @Input() scrollSpacing: number = 15;

  @Output() onSuccessSend: EventEmitter<string> = new EventEmitter();
  @Output() replyUserChange: EventEmitter<User> = new EventEmitter();

  @ViewChild("editor", { read: ElementRef }) editor: ElementRef<HTMLElement>;
  @ViewChild("editorContainer", { read: ElementRef }) editorContainer: ElementRef<HTMLElement>;
  @ViewChild("replyElement", { read: ElementRef }) replyElement: ElementRef<HTMLElement>;
  @ViewChild("smile") smileElm: TemplateRef<any>;
  @ViewChild("emojiListItem", { read: ElementRef }) emojiListItem: ElementRef<HTMLElement>;
  @ViewChild("emojiListToggleButton", { read: ElementRef }) emojiListToggleButton: ElementRef<HTMLElement>;

  private lastPosition: CaretPosition;
  private smileSize: number = 24;

  graffityData: GraffityDrawData;
  photos: MediaFile[] = [];
  youtubeVideos: YouTubeVideo[] = [];

  emojiClassName: string = "emoji-elm";

  sendLoader: boolean = false;

  needPetrovich$ = this.store$.select(translateNeedPetrovichSelector);
  i18nEmoji$ = this.needPetrovich$.pipe(map(() => this.translateService.get("components.emojies")));
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

  // Стили смайлика
  private smileStyles(data: EmojiData): SimpleObject {
    return this.emojiService.emojiSpriteStyles(data.sheet, data.set, this.smileSize);
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
    return !!this.getEditorValue || this.hasAttachment;
  }

  // Есть закрепленные данные
  get hasAttachment(): boolean {
    return !!this.graffityData?.image || !!this.photos?.length || !!this.youtubeVideos?.length;
  }

  // Предыдущий узел
  private getBeforeNode(node: Node, parent: Node) {
    if (node !== parent) {
      if (!!node.previousSibling) {
        return node.previousSibling;
      }
      // Поиск по родителям
      else {
        let tempNode: Node = node;
        // Поиск
        while (!!tempNode.parentElement && tempNode !== parent) {
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

  // Проверка дочерних элементов
  private hasChildNodes(node: Node) {
    const noHasChildAvail: string[] = ["img"];
    // Поиск
    if (!!node) {
      return node.nodeName.toLowerCase() === "#text" ?
        !!node.textContent :
        !!node.childNodes?.length || noHasChildAvail.includes(node.nodeName.toLowerCase());
    }
    // Нет потомков
    return false;
  }

  // Проверка ссылки YouTube
  private getYouTubeLinks(text: string): YouTubeVideoBase[] {
    const idSubString = "([A-z0-9\\-_]{11})";
    const founded: YouTubeVideoBase[] = [];
    // Преобразовать в массив ссылки из адресной строки
    const fillArray = (regExpString: string, idKey?: number) => {
      const regExp = new RegExp(regExpString, "ig");
      const matches = text.matchAll(regExp);
      // Анализ вхождений
      for (const match of matches) {
        const link = match[0];
        const params = UrlParamsStringToObject(link.split("?")[1]);
        const id = AnyToString(idKey >= 0
          ? match?.[idKey]
          : params?.["v"]
        );
        const startTime = ParseInt(params?.["t"], 0);
        // Удалось извлечь ID
        if (!!id) {
          founded.push({ link, id, startTime });
        }
      }
    };
    // Извлечение ссылок
    fillArray("https:\\/\\/(www\\.)?youtube\\.com\\/watch(\\/|\\?)(.*)?");
    fillArray("https:\\/\\/(www\\.)?youtube\\.com\\/watch\\/" + idSubString + "(\\/|\\?)?(.*)?", 2);
    fillArray("https:\\/\\/youtu\\.be\\/\\?(.*)?");
    fillArray("https:\\/\\/youtu\\.be\\/" + idSubString + "(\\/|\\?)?(.*)?", 1);
    // Вернуть найденные ссылки
    return founded;
  }



  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private emojiService: EmojiService,
    private stringTemplatePipe: StringTemplatePipe,
    private scrollService: ScrollService,
    private commentService: CommentService,
    private matDialog: MatDialog,
    private store$: Store,
    private translateService: TranslateService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.wrapControlsClass = this.wrapControls;
    // Изменение адресата ответа
    if (!!changes?.replyUser) {
      const prevUser: User = changes.replyUser?.previousValue;
      const nextUser: User = changes.replyUser?.currentValue;
      // Скрол к редактору
      if ((!prevUser && !!nextUser) || (!!prevUser && !!nextUser)) {
        WaitObservable(() => !this.editorContainer?.nativeElement || !this.replyElement?.nativeElement || !this.editor?.nativeElement, 10)
          .pipe(
            map(() => ({
              editorContainer: <HTMLElement>this.editorContainer.nativeElement,
              editor: <HTMLElement>this.editor.nativeElement,
              replyElement: <HTMLElement>this.replyElement.nativeElement
            })),
            takeUntil(this.destroyed$)
          )
          .subscribe(({ replyElement, editor }) => {
            const { y: currentScroll }: ScrollData = this.scrollService.getCurrentScroll;
            const replyBounding: DOMRect = replyElement.getBoundingClientRect();
            const replyStyles: CSSStyleDeclaration = getComputedStyle(replyElement);
            const mainMenuHeight: number = DrawDatas.minHeight;
            const scrollBorderTop: number = currentScroll + mainMenuHeight;
            // const scrollBorderBottom: number = currentScroll + window.innerHeight;
            const fieldBorderTop: number = currentScroll + replyBounding.top - ParseInt(replyStyles.marginTop) - mainMenuHeight - this.scrollSpacing;
            // const fieldBorderBottom: number = fieldBorderTop + editorContainer.clientHeight - this.scrollSpacing;
            // Скролл
            if (fieldBorderTop < scrollBorderTop) {
              this.scrollService.scrollToY(fieldBorderTop, "auto", false);
              editor.focus();
            }
          });
      }
    }
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
      const ignoreKeys: string[] = ["Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      const editor: HTMLElement = this.editor.nativeElement;
      const selection: Selection = document.getSelection();
      const keyEnter: boolean = !!event["key"] && ignoreKeys.includes(event["key"]);
      const firstChild: Node = editor.childNodes[0] ?? null;
      const noRemoveNode: Node = keyEnter
        ? selection.anchorNode
        : null;
      const hasfirstCHild = !!noRemoveNode && !!firstChild && this.getBeforeNode(noRemoveNode, editor) === firstChild && this.hasChildNodes(noRemoveNode);
      const noRemoveBeforeNode: Node = hasfirstCHild
        ? firstChild
        : null;
      // Начать очистку
      this.removeEmptyBr(editor, noRemoveNode, noRemoveBeforeNode);
      this.clearChild(editor, false, noRemoveNode, noRemoveBeforeNode);
    }
  }

  // Вставка из буффера
  onPaste(event: ClipboardEvent): void {
    let text: string = event.clipboardData.getData("text/plain");
    const youtubeLinks = this.getYouTubeLinks(text);
    // Очистить найденные ссылки
    youtubeLinks.forEach(data => {
      text = text.replace(data.link, "").trim();
      // Закрепить видео
      this.onAddYouTubeVideo(data);
    });
    // Остановка всплытия
    event.preventDefault();
    // Вставка текста
    if (!!text) {
      document.execCommand("insertHTML", false, text);
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
      const mediaPhotos: number[] = !!this.photos?.length ? this.photos.map(({ id }) => id) : [];
      const youTubeVideos: [string, number][] = ArrayMap(this.youtubeVideos, ({ id, startTime }) => ([id, startTime]))
      const graffity = !!this.graffityData?.blob
        ? new File([this.graffityData.blob], "graffity.jpg", { type: this.graffityData.blob.type })
        : null;
      const data: Partial<Comment> = {
        materialType: this.materialType,
        materialId: this.materialId,
        materialOwner: this.materialOwner,
        replyToUser: this.replyUser,
        text,
        uploadAttachment: {
          graffity,
          mediaPhotos,
          youTubeVideos
        }
      };
      // Проверка текста
      if (!!text || data?.uploadAttachment?.graffity || !!mediaPhotos || !!youTubeVideos) {
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
              // Очистить другие данные
              this.graffityData = null;
              this.photos = [];
              this.youtubeVideos = [];
              this.onReplyUserDelete();
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

  // Открыть окно граффити
  onGraffityPopupOpen(): void {
    PopupGraffityComponent.open(this.matDialog, { graffityData: this.graffityData }).afterClosed()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.graffityData = data;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Открыть окно загрузки фото
  onPhotoPopupOpen(): void {
    PopupPhotoUploaderComponent.open(this.matDialog, { multiUpload: true }).afterClosed()
      .pipe(
        filter(data => !!data?.mediaFiles?.length),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ mediaFiles: photos }) => {
        photos
          .filter(photo => !this.photos.some(({ id }) => id === photo.id))
          .forEach(photo => this.photos.push(photo));
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  // Удалить фото из закреплений
  onPhotoDelete(photoId: number): void {
    const index: number = this.photos.findIndex(({ id }) => id === photoId);
    // Элемент найден
    if (index >= 0) {
      this.photos.splice(index, 1);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Удалить фото из закреплений
  onYouTubeVideoDelete(youTubeId: string): void {
    const index: number = this.youtubeVideos.findIndex(({ id }) => id === youTubeId);
    // Элемент найден
    if (index >= 0) {
      this.youtubeVideos.splice(index, 1);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Удалить адресата ответа
  onReplyUserDelete(): void {
    this.replyUser = null;
    this.replyUserChange.emit(null);
    this.changeDetectorRef.detectChanges();
  }

  // Добавить видео YouTube
  private onAddYouTubeVideo({ id, startTime }: YouTubeVideoBase): void {
    const index = this.youtubeVideos.findIndex(youTube => id === youTube.id);
    const youTubeVideo: YouTubeVideo = {
      id,
      startTime,
      link: GetYouTubeLink(id),
      smallImage: GetYouTubeImage(id),
      middleImage: GetYouTubeImage(id, "hqdefault")
    }
    // Обновить видео
    if (index >= 0) {
      this.youtubeVideos[index] = youTubeVideo;
    }
    // Добавить видео
    else {
      this.youtubeVideos.push(youTubeVideo);
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }



  // Очистка переносов
  private removeEmptyBr(node: ChildNode, noRemoveNode: Node, noRemoveBeforeNode: Node) {
    const children: ChildNode[] = Array.from(node.childNodes);
    // Очистка дочерних
    children.forEach(child => this.removeEmptyBr(child, noRemoveNode, noRemoveBeforeNode));
    // Проверка
    const testChildren: ChildNode[] = Array.from(node.childNodes);
    // Удалить пустые переносы
    if (!!testChildren?.length && testChildren.every(child => child.nodeName.toLowerCase() === "br") && noRemoveNode !== node && noRemoveBeforeNode !== node) {
      testChildren.forEach(child => child.remove());
    }
  }

  // Функция поиска и очистки
  private clearChild(node: ChildNode, clearNode: boolean, noRemoveNode: Node, noRemoveBeforeNode: Node) {
    const children: ChildNode[] = Array.from(node.childNodes);
    const nodeName: string = node.nodeName.toLowerCase();
    const clearIgnore: string[] = ["#text", "br", "img"];
    // Очистка дочерних
    children.forEach(child => this.clearChild(child, true, noRemoveNode, noRemoveBeforeNode));
    // Очистка текущего элемента
    if (clearNode && !clearIgnore.includes(nodeName)) {
      const testChildren: ChildNode[] = Array.from(node.childNodes);
      // Удалить если нет дочерних элементов
      if (testChildren?.every(child => !this.hasChildNodes(child)) && noRemoveNode !== node && noRemoveBeforeNode !== node) {
        node.remove();
      }
    }
  };

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

  // Замена div'ов
  private editorBlockReplace(editor: HTMLElement): void {
    ShortModeBlockRemoveTags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, true)));
  }

  // Замена div'ов
  private editorInlineReplace(editor: HTMLElement): void {
    ShortModeInlineRemoveTags.forEach(tag => Array.from(editor.getElementsByTagName(tag)).forEach(node => this.editorTagRemove(editor, node, false)));
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
