import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { OptionData } from '@_controlers/autocomplete-input/autocomplete-input.component';
import { PrivateType, PrivateTypes, User, UserPrivate, UserPrivateItem, UserPrivateNameItem, UserPrivateNames } from '@_models/account';
import { CustomObjectKey } from '@_models/app';
import { NavMenuType } from '@_models/nav-menu';
import { ScreenBreakpoints, ScreenKeys } from '@_models/screen';
import { AccountService } from '@_services/account.service';
import { ScreenService } from '@_services/screen.service';
import { Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-profile-settings-private',
  templateUrl: './profile-settings-private.component.html',
  styleUrls: ['./profile-settings-private.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsPrivateComponent implements OnInit, OnDestroy {


  settingsLoader: boolean = false;
  private firstFormUpdate: boolean = true;

  form: FormGroup;
  user: User;
  users: User[];
  private breakpoint: ScreenKeys = "default";

  listTypes: typeof ListType = ListType;
  navMenuType: NavMenuType = NavMenuType.collapse;
  ruleNames: UserPrivateNameItem[] = UserPrivateNames;

  privateTypes: OptionData[] = PrivateTypes;

  private destroy$: Subject<void> = new Subject<void>();





  // Данные о пользователе
  getUser(userId: number): User {
    return this.users.find(({ id }) => id === userId)! ?? null;
  }

  // Список пользователей
  getUsers(rule: keyof UserPrivate, listType: ListType): User[] {
    const listTypeName: keyof UserPrivateItem = listType === ListType.white ? "whiteList" : "blackList";
    // Вернуть массив
    return ((this.form?.get(rule)?.get(listTypeName) as FormArray)?.value ?? [])
      .map(userId => this.getUser(userId));
  }

  // Количество пользователей в одной строке списка
  get getUserInListCount(): number {
    return UserInListCount[this.breakpoint];
  }





  constructor(
    private accountService: AccountService,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.defineData(true);
  }

  ngOnInit() {
    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.defineData(false);
      });
    // Подписка на смену брейкпоинта
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroy$))
      .subscribe(breakpoint => {
        this.breakpoint = breakpoint;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Удалить пользователя из списка
  onUserDelete(id: number, rule: keyof UserPrivate, listType: ListType): void {
    if (!this.settingsLoader) {
      const userListIndex: number = this.getUsers(rule, listType).map(({ id }) => id).findIndex(userId => userId === id);
      const listTypeName: keyof UserPrivateItem = listType === ListType.white ? "whiteList" : "blackList";
      // Удалить пользователя из списка
      (this.form?.get(rule)?.get(listTypeName) as FormArray).removeAt(userListIndex);
      // Сохранить настройки
      this.onSave();
    }
  }

  // Сохранить настройки приватности
  onSave(): void {
    if (!this.settingsLoader) {
      this.settingsLoader = true;
      this.changeDetectorRef.detectChanges();
      // Новые настройки приватности
      const privateDatas: UserPrivate = this.ruleNames
        .map(({ rule }) => rule)
        .reduce((o, rule) => {
          const formGroup: FormGroup = this.form?.get(rule) as FormGroup;
          // Вернуть модель
          return {
            ...o,
            [rule as keyof UserPrivate]: {
              type: formGroup?.get("type")?.value ?? PrivateType.public,
              whiteList: formGroup?.get("whiteList")?.value ?? [],
              blackList: formGroup?.get("blackList")?.value ?? []
            } as UserPrivateItem
          };
        }, {} as UserPrivate);
      // Подписчик
      this.accountService.saveUserPrivateSettings(privateDatas)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          () => {
            this.settingsLoader = false;
            this.changeDetectorRef.detectChanges();
          },
          () => this.settingsLoader = false
        );
    }
  }





  // Создание формы
  private defineData(create: boolean = false): void {
    // Новая форма
    if (create) {
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
      // Заполнить форму
      this.form = this.formBuilder.group(formDatas);
    }
    // Обновить
    else {
      this.ruleNames
        .map(({ rule }) => ({ formGroup: this.form?.get(rule) as FormGroup, privateItem: this.user.private[rule] }))
        .forEach(({ formGroup, privateItem }) => {
          formGroup?.get("type")?.setValue(privateItem.type);
          // Обновить списки
          (["whiteList", "blackList"] as (keyof UserPrivateItem)[])
            .forEach(key => {
              const control: FormArray = (formGroup?.get(key) as FormArray);
              control.clear();
              (privateItem[key] as number[]).forEach(u => control.push(this.formBuilder.control(u)));
            });
        });
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
    // Список пользователей
    this.defineUsers();
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




// Тип списка
enum ListType {
  white,
  black
}

// Количество пользователей в одной строке
const UserInListCount: CustomObjectKey<keyof ScreenBreakpoints, number> = {
  default: 2,
  xlarge: 3,
  large: 2,
  middle: 2,
  small: 3,
  xsmall: 2,
};
