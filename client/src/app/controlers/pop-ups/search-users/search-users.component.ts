import { AppMatDialogConfig } from "@_datas/app";
import { SearchUser, User, UserPrivate, UserPrivateItem } from "@_models/account";
import { ScreenKeys } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-search-users",
  templateUrl: "./search-users.component.html",
  styleUrls: ["search-users.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PopupSearchUsersComponent implements OnInit, OnDestroy {


  static popUpWidth: string = "800px";

  form: FormGroup;
  private user: User;
  users: User[];
  breakpoint: ScreenKeys = "default";

  ready: boolean = false;
  loading: boolean = false;
  usersCount: number = 0;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopupSearchUsersData,
    private matDialogRef: MatDialogRef<PopupSearchUsersComponent, number>,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private screenService: ScreenService
  ) {
    this.form = this.formBuilder.group({
      q: [""]
    });
  }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        // Первая загрузка
        if (!this.ready) {
          this.ready = true;
          this.onSearch();
        }
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
    // Подписка на брейкпоинт
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroy$))
      .subscribe(breakpoint => {
        this.breakpoint = breakpoint;
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Поиск пользователей
  onSearch(): void {
    const rule: UserPrivateItem = this.user.private[this.data.rule];
    const search: string = this.form?.get("q")?.value ?? "";
    const searchId: number = parseInt(search);
    const q: string = searchId > 0 && !isNaN(searchId) ? "" : search;
    const ids: number[] = searchId > 0 && !isNaN(searchId) ? [searchId] : [];
    const searchData: Partial<SearchUser> = {
      q,
      ids,
      excludeIds: [this.user.id, ...rule.whiteList, ...rule.blackList],
      page: 1,
      limit: 20
    };
    // Настройка параметров
    this.loading = true;
    this.users = [];
    this.usersCount = 0;
    // Поиск
    if (!!q?.length || !!ids.length) {
      this.accountService.search(searchData, ["0002"])
        .pipe(takeUntil(this.destroy$))
        .subscribe(({ result: users, count }) => {
          this.users = count > 0 ? users : [];
          this.usersCount = count;
          this.loading = false;
          // Обновить
          this.changeDetectorRef.detectChanges();
        });
    }
    // Пустой поиск
    else {
      this.loading = false;
    }
  }

  // Выбрать пользователя
  onUserChoice(userId: number): void {
    this.matDialogRef.close(userId);
  }





  // Открыть текущее окно
  static open(matDialog: MatDialog, data: PopupSearchUsersData): MatDialogRef<PopupSearchUsersComponent> {
    const matDialogConfig: MatDialogConfig = { ...AppMatDialogConfig };
    matDialogConfig.width = PopupSearchUsersComponent.popUpWidth;
    matDialogConfig.data = data;
    // Вернуть диалог
    return matDialog.open(PopupSearchUsersComponent, matDialogConfig);
  }
}





// Интерфейс входящих данных
export interface PopupSearchUsersData {
  subTitle: string;
  rule: keyof UserPrivate;
  listTypeName: keyof UserPrivateItem;
}
