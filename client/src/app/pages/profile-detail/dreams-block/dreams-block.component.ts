import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { DreamPlural } from "@_datas/dream";
import { User, UserSex } from "@_models/account";
import { Search } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { Dream } from "@_models/dream";
import { ScreenBreakpoints } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { FriendService } from "@_services/friend.service";
import { ScreenService } from "@_services/screen.service";
import { catchError, filter, map, mergeMap, of, skipWhile, Subject, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-dreams-block",
  templateUrl: "./dreams-block.component.html",
  styleUrls: ["dreams-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamsBlockComponent implements OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  userHasDiaryAccess: boolean = false;
  dreamsLoading: boolean = false;

  dreams: Dream[];
  dreamsCount: number = 0;

  dreamPlural: SimpleObject = DreamPlural;

  private destroyed$: Subject<void> = new Subject();





  // Проверка пола
  get userIsMale(): boolean {
    return this.user.sex === UserSex.Male;
  }





  constructor(
    private screenService: ScreenService,
    private accountService: AccountService,
    private friendService: FriendService,
    private dreamService: DreamService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.defineDreams();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Загрузить список сновидний
  private defineDreams(): void {
    const defaultDreamsResult: Search<Dream> = { count: 0, result: [], limit: 1 };
    const limits: Partial<ScreenBreakpoints> = {
      default: 1,
      xlarge: 3,
      large: 2
    };
    let prevLimit: number = 0;
    // Настройки
    this.dreamsLoading = true;
    // Поиск сновидений
    timer(0, 50)
      .pipe(
        takeUntil(this.destroyed$),
        takeWhile(() => !this.user, true),
        skipWhile(() => !this.user),
        mergeMap(() => this.screenService.breakpoint$),
        mergeMap(() => this.itsMyPage ? of(true) : this.friendService.friends$(this.user.id, 0), r => r),
        map(breakPoint => limits[breakPoint] ?? limits.default),
        filter(limit => {
          if (limit !== prevLimit) {
            prevLimit = limit;
            // Запустить загрузчик
            this.dreamsLoading = true;
            this.changeDetectorRef.detectChanges();
            // Обновить
            return true;
          }
          // Не обновлять
          return false;
        }),
        mergeMap(
          () => this.itsMyPage ? of(true) : this.accountService.checkPrivate("myDreamList", this.user.id, ["8100"]),
          (limit, hasAccess) => ({ limit, hasAccess })
        ),
        mergeMap(
          ({ hasAccess, limit }) => hasAccess ? this.dreamService.search({ user: this.user.id, limit }, ["0002", "8100"]) : of(defaultDreamsResult),
          ({ hasAccess }, { count, result: dreams, limit }) => ({ hasAccess, count, dreams, limit })
        ),
        catchError(() => of({ hasAccess: false, dreams: [], count: 0 }))
      )
      .subscribe(({ hasAccess, dreams, count }: any) => {
        this.userHasDiaryAccess = hasAccess;
        this.dreams = dreams;
        this.dreamsCount = count;
        this.dreamsLoading = false;
        this.changeDetectorRef.detectChanges();
      }, e => console.log(e));
  }
}
