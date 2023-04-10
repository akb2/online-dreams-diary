import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Comment, CommentMaterialType } from "@_models/comment";
import { CommentService } from "@_services/comment.service";
import { Subject, takeUntil } from "rxjs";





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

  comments: Comment[] = [];
  count: number = 0;

  loading: boolean = true;
  moreLoading: boolean = false;

  skipComments: number = 0;

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





  constructor(
    private commentService: CommentService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadComments(true);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Загрузка комментариев
  private loadComments(listenNew: boolean = false): void {
    this.moreLoading = true;
    this.changeDetectorRef.detectChanges();
    // Запрос комментариев
    this.commentService.getList(this.materialType, this.materialId, this.skipComments, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        ({ result: comments, count }) => {
          this.addComment(comments);
          // Обновить
          this.count = count;
          this.loading = false;
          this.moreLoading = false;
          this.changeDetectorRef.detectChanges();
          // Прослушивание новых комментариев
          if (listenNew) {
            this.waitNewComment();
          }
        },
        () => {
          this.loading = false;
          this.moreLoading = false;
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
  private addComment(mixedComments: Comment | Comment[]): void {
    const comments: Comment[] = Array.isArray(mixedComments) ? mixedComments : [mixedComments];
    // Данные в порядке
    if (!!comments && this.comments) {
      // Добавление
      comments
        .filter(comment => !!comment)
        .forEach(comment => {
          const index: number = this.comments.findIndex(c => !!comment?.id && !!c.id && comment.id === c.id);
          // Обновить
          if (index >= 0) {
            this.comments[index] = comment;
          }
          // Добавить
          else {
            this.comments.push(comment);
            this.skipComments++;
          }
        });
      // Сортировка
      if (!!this.comments?.length) {
        this.comments = this.comments
          .filter(comment => !!comment)
          .sort(({ createDate: a }, { createDate: b }) => a > b ? -1 : (a < b ? 1 : 0));
      }
    }
  }

  // Загрузить больше комментариев
  loadMoreComments(): void {
    if (this.skipComments < this.count && this.count > 0 && !this.moreLoading) {
      this.loadComments();
    }
  }
}
