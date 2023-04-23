import { WaitObservable } from "@_datas/api";
import { VoidFunctionVar } from "@_datas/app";
import { DrawDatas } from "@_helpers/draw-datas";
import { ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { Comment, CommentMaterialType, SearchRequestComment } from "@_models/comment";
import { NumberDirection } from "@_models/math";
import { ScrollData } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { CommentService } from "@_services/comment.service";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject, of } from "rxjs";
import { catchError, map, mergeMap, take, takeUntil, timeout } from "rxjs/operators";





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

  @Output() replyEvent: EventEmitter<User> = new EventEmitter();

  @ViewChildren("comment", { read: ElementRef }) commentElms: QueryList<ElementRef>;

  private user: User;
  comments: Comment[] = [];
  count: number = 0;

  loading: boolean = true;
  prevLoading: boolean = false;
  nextLoading: boolean = false;
  prevLeftCount: number = 0;
  nextLeftCount: number = 0;

  minDate: Date;
  maxDate: Date;
  minId: number;
  maxId: number;

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
      comment?.attachment?.graffity?.url
    ];
    // Объединить данные
    return dataStrings.join("-");
  }

  // Доступность ответа
  isReplyAvail(comment: Comment): boolean {
    return this.writeAccess && !!this.user?.id && !!comment?.user?.id && this.user.id !== comment.user.id;
  }

  // Получить элемент комментария
  private getCommentElm(commentId: number): HTMLElement {
    return this.commentElms.find(elementRef => ParseInt(elementRef.nativeElement.getAttribute('comment-id')) === commentId)?.nativeElement ?? null;
  }





  constructor(
    private commentService: CommentService,
    private screenService: ScreenService,
    private scrollService: ScrollService,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroyed$),
        take(1),
        map(params => ParseInt(params.goToComment))
      )
      .subscribe(startWithId => this.loadComments(true, startWithId));
    // Загрузка данных о текущем пользователе
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
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
        takeUntil(this.destroyed$),
        timeout(1000),
        take(5)
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
}
