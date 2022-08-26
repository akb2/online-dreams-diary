import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OptionData } from '@_controlers/autocomplete-input/autocomplete-input.component';
import { PrivateTypes, User, UserPrivate, UserPrivateItem, UserPrivateNameItem, UserPrivateNames } from '@_models/account';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-profile-settings-private',
  templateUrl: './profile-settings-private.component.html',
  styleUrls: ['./profile-settings-private.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsPrivateComponent implements OnInit, OnDestroy {


  form: FormGroup;
  user: User;
  users: User[];

  navMenuType: NavMenuType = NavMenuType.collapse;
  ruleNames: UserPrivateNameItem[] = UserPrivateNames;

  privateTypes: OptionData[] = PrivateTypes;

  private destroy$: Subject<void> = new Subject<void>();





  // Данные о пользователе
  getUser(userId: number): User {
    return this.users.find(({ id }) => id === userId)! ?? null;
  }





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.defineData();
  }

  ngOnInit() {
    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.defineData();
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Создание формы
  private defineData(): void {
    const formDatas = this.ruleNames.reduce((o, r) => {
      const ruleItem: UserPrivateItem = this.user?.private[r.rule] ?? this.accountService.getDefaultUserPrivateItem;
      // Вернуть модель
      return {
        ...o,
        [r.rule as string]: this.formBuilder.group({
          type: ruleItem.type,
          whiteList: this.formBuilder.array(ruleItem.whiteList),
          blackList: this.formBuilder.array(ruleItem.blackList)
        })
      };
    }, {});
    // Список пользователей
    this.defineUsers();
    // Заполнить форму
    this.form = this.formBuilder.group(formDatas);
  }

  // Заполнить список задействованных пользователей
  private defineUsers(): void {
    const limit: number = 250;
    const privateRules: UserPrivate = this.accountService.userPrivateConverter(this.user?.private);
    const ids: number[] = Object.values(privateRules)
      .map(({ whiteList, blackList }: UserPrivateItem) => ([...whiteList, ...blackList]))
      .reduce((o, v) => ([...o, ...v]), []);
    // Заполнить список
    if (!!ids?.length) {
      this.accountService.search({ ids, limit })
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          ({ result: users }) => {
            this.users = users;
            this.changeDetectorRef.detectChanges();
          },
          () => this.users = []
        );
    }
    // Список пуст
    else {
      this.users = [];
    }
  }
}
