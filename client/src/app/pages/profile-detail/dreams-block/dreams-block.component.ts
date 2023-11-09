import { User, UserSex } from "@_models/account";
import { Dream } from "@_models/dream";
import { DreamService } from "@_services/dream.service";
import { FriendService } from "@_services/friend.service";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, catchError, concatMap, of, skipWhile, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-dreams-block",
  templateUrl: "./dreams-block.component.html",
  styleUrls: ["dreams-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamsBlockComponent implements OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;
  @Input() isAutorizedUser: boolean;

  userHasDiaryAccess: boolean = false;
  dreamsLoading: boolean = false;

  dreams: Dream[];
  dreamsCount: number = 0;
  dreamLimit: number = 3;

  isMobile: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  // Проверка пола
  get userIsMale(): boolean {
    return this.user.sex === UserSex.Male;
  }





  constructor(
    private friendService: FriendService,
    private dreamService: DreamService,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.defineDreams();
    // Тип экрана
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Загрузить список сновидний
  private defineDreams(): void {
    this.dreamsLoading = true;
    // Поиск сновидений
    timer(0, 50)
      .pipe(
        takeWhile(() => !this.user, true),
        skipWhile(() => !this.user),
        concatMap(() => this.itsMyPage || !this.isAutorizedUser ? of(true) : this.friendService.friends$(this.user.id, 0), r => r),
        concatMap(
          () => this.dreamService.search({ user: this.user.id, limit: this.dreamLimit }, ["0002", "8100"]),
          (friend, { count, result: dreams, limit, hasAccess }) => ({ count, dreams, limit, friend, hasAccess })
        ),
        catchError(() => of({ hasAccess: false, dreams: [], count: 0 })),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ dreams, count, hasAccess }: any) => {
        this.userHasDiaryAccess = hasAccess;
        this.dreams = dreams;
        this.dreamsCount = count;
        this.dreamsLoading = false;
        this.changeDetectorRef.detectChanges();
      });
  }
}
