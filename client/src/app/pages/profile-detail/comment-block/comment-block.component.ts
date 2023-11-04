import { ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { CommentMaterialType } from "@_models/comment";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, concatMap, map, of, takeUntil } from "rxjs";





@Component({
  selector: "app-comment-block",
  templateUrl: "./comment-block.component.html",
  styleUrls: ["./comment-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBlockComponent implements OnInit, OnDestroy {


  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() materialOwner: number;
  @Input() placeholder: string = "components.comment.editor.placeholder";
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";
  @Input() wrapControls: boolean = false;

  authState: boolean = false;
  writeAccess: boolean = false;
  readAccess: boolean = false;

  replyUser: User;

  scrollSpacing: number = 0;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private hostElement: ElementRef,
    private accountService: AccountService,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(
        concatMap(
          () => !!this.materialOwner ? this.accountService.user$(this.materialOwner) : of(null),
          (user, visitedUser) => ({ user, visitedUser })
        ),
        concatMap(
          ({ visitedUser }) => !!visitedUser ? this.accountService.checkPrivate("myCommentsWrite", visitedUser?.id, ["8100"]) : of(false),
          (data, writeAccess) => ({ ...data, writeAccess })
        ),
        concatMap(
          ({ visitedUser }) => !!visitedUser ? this.accountService.checkPrivate("myCommentsRead", visitedUser?.id, ["8100"]) : of(false),
          (data, readAccess) => ({ ...data, readAccess })
        ),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ user, writeAccess, readAccess }) => {
        this.authState = !!user?.id;
        this.writeAccess = writeAccess;
        this.readAccess = readAccess;
        this.changeDetectorRef.detectChanges();
      });
    // Изменение отступов
    this.screenService.breakpoint$
      .pipe(
        map(() => this.hostElement?.nativeElement),
        takeUntil(this.destroyed$)
      )
      .subscribe(hostElement => {
        this.scrollSpacing = !!hostElement ? ParseInt(getComputedStyle(hostElement).rowGap) : 0;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Ответить на комментарий
  onReply(user: User): void {
    this.replyUser = user;
    this.changeDetectorRef.detectChanges();
  }
}
