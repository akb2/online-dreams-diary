import { MediaFileView, MediaFileViewType, PopupPhotoViewerComponent } from "@_controlers/photo-viewer/photo-viewer.component";
import { VoidFunctionVar } from "@_datas/app";
import { DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamTitle } from "@_datas/dream-map-settings";
import { DrawDatas } from "@_helpers/draw-datas";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { UniqueArray } from "@_helpers/objects";
import { WaitObservable } from "@_helpers/rxjs";
import { User } from "@_models/account";
import { CustomObject, CustomObjectKey } from "@_models/app";
import { Comment, CommentMaterialType, SearchRequestComment } from "@_models/comment";
import { Dream, DreamMode, DreamMood, DreamType } from "@_models/dream";
import { OptionData } from "@_models/form";
import { NumberDirection } from "@_models/math";
import { NavMenuType } from "@_models/nav-menu";
import { ScrollData } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { CommentService } from "@_services/comment.service";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { Location } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { Subject, merge } from "rxjs";
import { concatMap, filter, map, mergeMap, take, takeUntil, timeout } from "rxjs/operators";





@Component({
  selector: "app-comment-list",
  templateUrl: "./comment-list.component.html",
  styleUrls: ["./comment-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentListComponent implements OnInit, OnDestroy {


  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";
  @Input() writeAccess: boolean = false;
  @Input() goToCommentScrollSubtrahend: number = DrawDatas.minHeight;
  @Input() attachmentPerLine: number = 5;

  @Output() replyEvent: EventEmitter<User> = new EventEmitter();

  @ViewChild("list", { read: ElementRef }) listElm: ElementRef;
  @ViewChildren("comment", { read: ElementRef }) commentElms: QueryList<ElementRef>;
  @ViewChildren("commentAvatar", { read: ElementRef }) commentAvatarElms: QueryList<ElementRef>;

  private user: User;
  comments: Comment[] = [];
  count: number = 0;
  private inScreenComments: number[] = [];
  private avatarTopPositions: CustomObjectKey<number, number> = {};

  loading: boolean = true;
  prevLoading: boolean = false;
  nextLoading: boolean = false;
  prevLeftCount: number = 0;
  nextLeftCount: number = 0;

  minDate: Date;
  maxDate: Date;
  minId: number;
  maxId: number;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  defaultDreamTitle: string = DreamTitle;
  today: Date = new Date();

  private goToCommentUrlParam: string = "goToComment";
  private openMediaViewerId: string = "openMediaViewer";

  private destroyed$: Subject<void> = new Subject();





  // Функция проверки пользователя для обновления списка
  listTrackBy(index: number, comment: Comment): string {
    const dataStrings: string[] = [
      comment.id.toString(),
      comment.createDate?.toISOString(),
      comment.user.id.toString(),
      comment.user.name,
      comment.user.lastName,
      comment.user.avatars?.small,
      comment.user.online ? "true" : "false",
      comment.text,
      comment?.attachment?.graffity?.url,
      comment?.attachment?.graffity?.urlLarge,
      comment?.attachment?.graffity?.urlMiddle,
      comment?.attachment?.graffity?.urlSmall
    ];
    // Объединить данные
    return dataStrings.join("-");
  }

  // Доступность ответа
  isReplyAvail(comment: Comment): boolean {
    return this.writeAccess && !!this.user?.id && !!comment?.user?.id && this.user.id !== comment.user.id;
  }

  // Доступность удаления
  isDeleteAvail(comment: Comment): boolean {
    return !!this.user && comment?.user?.id === this.user?.id;
  }

  // Получить элемент комментария
  private getCommentElm(commentId: number): HTMLElement {
    return this.commentElms.find(elementRef => ParseInt(elementRef.nativeElement.getAttribute('comment-id')) === commentId)?.nativeElement ?? null;
  }

  // Получить элемент аватарки комментария
  private getCommentAvatarElm(commentId: number): HTMLElement {
    return this.commentAvatarElms.find(elementRef => ParseInt(elementRef.nativeElement.getAttribute('comment-id')) === commentId)?.nativeElement ?? null;
  }

  // Количество закреплений
  getAttachmentCount(comment: Comment): number {
    let count: number = 0;
    // Есть закрепления
    if (!!comment?.attachment) {
      // Граффити
      if (!!comment.attachment?.graffity) {
        count++;
      }
      // Сновидения
      if (!!comment.attachment?.dreams?.length) {
        count += UniqueArray(comment.attachment.dreams).length;
      }
      // Фотографии
      if (!!comment.attachment?.mediaPhotos?.length) {
        count += UniqueArray(comment.attachment.mediaPhotos).length;
      }
    }
    // Вернуть количество комментариев
    return count;
  }

  // У сна есть обложка
  isHasImage(dream: Dream): boolean {
    return dream.headerType === NavMenuType.full || dream.headerType === NavMenuType.short;
  }

  // Подробные сведения о приватности сновидения
  getDreamPrivate(dream: Dream): OptionData {
    return DreamStatuses.find(({ key }) => key === dream.status.toString()) ?? DreamStatuses[0];
  }

  // Тип сновидения
  getDreamType(dream: Dream): OptionData {
    return DreamTypes.find(({ key }) => key === dream.type.toString()) ?? DreamTypes.find(({ key }) => key === DreamType.Simple.toString());
  }

  // Настроение сновидения
  getDreamMood(dream: Dream): OptionData {
    return DreamMoods.find(({ key }) => key === dream.mood.toString()) ?? DreamMoods.find(({ key }) => key === DreamMood.Nothing.toString());
  }

  // Есть карта сновидений
  dreamHasMap(dream: Dream): boolean {
    return dream.mode === DreamMode.map || dream.mode === DreamMode.mixed;
  }

  // Позиция аватарки сверху
  getAvatarTopPosition(commentId: number): number {
    return ParseInt(this.avatarTopPositions?.[commentId]);
  }





  constructor(
    private commentService: CommentService,
    private screenService: ScreenService,
    private scrollService: ScrollService,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private changeDetectorRef: ChangeDetectorRef,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(
        take(1),
        map(params => ParseInt(params?.[this.goToCommentUrlParam])),
        takeUntil(this.destroyed$)
      )
      .subscribe(startWithId => this.loadComments(true, startWithId));
    // Загрузка данных о текущем пользователе
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.changeDetectorRef.detectChanges();
      });
    // Скольжение аватарок видимых комментариев
    WaitObservable(() => !this.listElm?.nativeElement)
      .pipe(
        concatMap(() => merge(
          this.scrollService.onAlwaysScroll(),
          this.screenService.breakpoint$.pipe(
            map(() => this.scrollService.getCurrentScroll)
          )
        )),
        filter(() => !!this.inScreenComments.length),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ y }) => {
        const listElm: HTMLElement = this.listElm.nativeElement;
        const gapY: number = ParseInt(window.getComputedStyle(listElm)?.rowGap);
        const avatarTop: number = y + DrawDatas.minHeight + gapY;
        // Цикл по элементам
        this.inScreenComments.forEach(commentId => {
          const commentElm: HTMLElement = this.getCommentElm(commentId);
          const commentAvatarElm: HTMLElement = this.getCommentAvatarElm(commentId);
          const minTop: number = y + commentElm.getBoundingClientRect().top;
          const maxTop: number = minTop + commentElm.getBoundingClientRect().height - commentAvatarElm.getBoundingClientRect().height;
          // Элемент найден
          if (!!commentElm) {
            this.avatarTopPositions[commentId] = CheckInRange(avatarTop, maxTop, minTop) - minTop;
          }
        });
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Ответить
  onReply(user: User): void {
    if (!!user) {
      this.replyEvent.emit(user);
    }
  }

  // Элемент в области видимости
  onLoadMoreComments(next: boolean): void {
    const lastId: number = next ? this.maxId : this.minId;
    const lastDate: Date = next ? this.maxDate : this.minDate;
    const loadListType: NumberDirection = next ? 1 : -1;
    // Загрузка новых комментариев
    if ((next && !this.nextLoading) || (!next && !this.prevLoading)) {
      this.loadComments(false, lastId, lastDate, loadListType);
    }
  }

  // Добавить скролл для новых элементов
  private onSubtrahendCommentElm(): void {
    this.scrollService.saveScroll()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(VoidFunctionVar, VoidFunctionVar);
  }

  // Скролл к комментарию
  private onGoToComment(commentId: number): void {
    WaitObservable(() => !this.getCommentElm(commentId))
      .pipe(
        map(() => this.getCommentElm(commentId)),
        mergeMap(commentElm => this.screenService.elmResize(commentElm)),
        timeout(1000),
        take(5),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        data => {
          const commentElm = data[0].element;
          const { y: scroll }: ScrollData = this.scrollService.getCurrentScroll;
          const top: number = commentElm.getBoundingClientRect().top - this.goToCommentScrollSubtrahend + scroll;
          // Скролл к комментарию
          this.scrollService.scrollToY(top, "auto", false);
        },
        VoidFunctionVar
      );
  }

  // Комментарий появился на экране
  onCommentInScreen(commentId: number): void {
    if (!this.inScreenComments.includes(commentId)) {
      this.inScreenComments.push(commentId);
    }
  }

  // Комментарий ушел за экран
  onCommentOutOfScreen(commentId: number): void {
    const index: number = this.inScreenComments.findIndex(id => id === commentId);
    // Элемент найден
    if (index >= 0) {
      this.inScreenComments.splice(index, 1);
    }
  }

  // Увеличить фото вложения
  onViewPhoto(comment: Comment, mediaFileId: number): void {
    const mediaFiles: MediaFileView[] = [
      { ...comment.attachment.graffity, viewType: MediaFileViewType.graffity },
      ...comment.attachment.mediaPhotos.map(file => ({ ...file, viewType: MediaFileViewType.media }))
    ].filter(file => !!file?.id);
    // Обновить URL
    this.updateUrl({
      [this.goToCommentUrlParam]: comment.id,
      [this.openMediaViewerId]: mediaFileId
    });
    // Открыть окно
    PopupPhotoViewerComponent.open(this.matDialog, { mediaFiles, mediaFileId });
  }





  // Загрузка комментариев
  private loadComments(listenNew: boolean = false, startWithId: number = 0, lastDate: Date = null, loadListType: NumberDirection = 0): void {
    const prevNextLoad: boolean = startWithId > 0 && !!lastDate && loadListType !== 0;
    const lastSearch: Partial<SearchRequestComment> = prevNextLoad ?
      {
        loadListType,
        lastDate: lastDate?.toISOString().slice(0, -5) + "Z",
        lastId: startWithId
      } :
      { startWithId };
    // Обновить лоадеры
    this.prevLoading = prevNextLoad && loadListType === -1 ? true : this.prevLoading;
    this.nextLoading = prevNextLoad && loadListType === 1 ? true : this.nextLoading;
    // Обновить
    this.changeDetectorRef.detectChanges();
    // Значения для поиска
    const search: Partial<SearchRequestComment> = {
      ...lastSearch,
      materialType: this.materialType,
      materialId: this.materialId
    };
    // Запрос комментариев
    this.commentService.getList(search, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        ({ result: comments, count, prevCount, nextCount }) => {
          this.addComment(comments, loadListType === 1, startWithId);
          // Обновить
          this.count = count;
          this.loading = false;
          this.prevLoading = false;
          this.nextLoading = false;
          this.prevLeftCount = loadListType === 1 ? this.prevLeftCount : prevCount;
          this.nextLeftCount = loadListType === -1 ? this.nextLeftCount : nextCount;
          this.changeDetectorRef.detectChanges();
          // Прослушивание новых комментариев
          if (listenNew) {
            this.waitNewComment();
          }
        },
        () => {
          this.loading = false;
          this.prevLoading = false;
          this.nextLoading = false;
          this.changeDetectorRef.detectChanges();
          // Прослушивание новых комментариев
          if (listenNew) {
            this.waitNewComment();
          }
        }
      );
  }

  // Прослушивание новых комментариев
  private waitNewComment(): void {
    this.commentService.waitNewComment(this.materialType, this.materialId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(comment => {
        this.addComment(comment);
        // Обновить
        this.count++;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Добавить комментарии в общий список
  private addComment(mixedComments: Comment | Comment[], saveScroll: boolean = false, goToComment: number = 0): void {
    const comments: Comment[] = (Array.isArray(mixedComments) ? mixedComments : [mixedComments]).filter(comment => !!comment);
    let savingScroll = false;
    // Данные в порядке
    if (!!comments && this.comments) {
      // Добавление
      comments.forEach(comment => {
        const index: number = this.comments.findIndex(c => !!comment?.id && !!c.id && comment.id === c.id);
        // Обновить
        if (index >= 0) {
          this.comments[index] = comment;
        }
        // Добавить
        else {
          this.comments.push(comment);
          savingScroll = saveScroll ? true : savingScroll;
        }
      });
      // Вычесть высоту комментария из скролла
      if (savingScroll) {
        this.onSubtrahendCommentElm();
      }
      // Сортировка
      if (!!this.comments?.length) {
        this.comments = this.comments.sort(({ createDate: dateA, id: idA }, { createDate: dateB, id: idB }) => {
          const date: NumberDirection = dateA > dateB ? -1 : (dateA < dateB ? 1 : 0);
          const id: NumberDirection = idA > idB ? -1 : (idA < idB ? 1 : 0);
          // Сортировка
          return date === 0 ? id : date;
        });
        // Последний ключ
        const lastIndex: number = this.comments?.length - 1;
        // Параметры
        this.maxId = this.comments[0].id;
        this.minId = this.comments[lastIndex].id;
        this.maxDate = this.comments[0].createDate;
        this.minDate = this.comments[lastIndex].createDate;
      }
      // Обновить
      this.changeDetectorRef.detectChanges();
      // Перейти к комментарию
      if (goToComment > 0) {
        this.onGoToComment(goToComment);
      }
    }
  }

  // Обновить URL
  private updateUrl(params: CustomObject<string | number>): void {
    const currentUrl: string = this.location?.path() ?? "";
    const currentPath: string = currentUrl.split('?')?.[0] ?? "";
    const queryString: URLSearchParams = new URLSearchParams(currentUrl.split('?')?.[1] ?? "");
    // Добавить параметры
    Object.entries(params).forEach(([key, value]) => queryString.set(key, value?.toString()));
    // Обновить URL
    this.location.replaceState(currentPath + "?" + queryString.toString());
  }
}
