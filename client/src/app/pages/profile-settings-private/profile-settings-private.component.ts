import { PopupSearchUsersComponent } from '@_controlers/search-users/search-users.component';
import { DefaultUserPrivItem, PeoplePlural, PrivateTypes, UserPrivateNames } from "@_datas/account";
import { PrivateType, User, UserPrivate, UserPrivateItem, UserPrivateNameItem } from '@_models/account';
import { SimpleObject } from '@_models/app';
import { OptionData } from "@_models/form";
import { NavMenuType } from '@_models/nav-menu';
import { ScreenBreakpoints, ScreenKeys } from '@_models/screen';
import { AccountService } from '@_services/account.service';
import { ScreenService } from '@_services/screen.service';
import { CustomObjectKey } from "@akb2/types-tools";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-profile-settings-private',
  templateUrl: './profile-settings-private.component.html',
  styleUrls: ['./profile-settings-private.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsPrivateComponent implements OnInit, OnDestroy {


  settingsLoader: boolean = false;

  form: FormGroup;
  user: User;
  users: User[];

  private breakpoint: ScreenKeys = "default";
  private showAll: CustomObjectKey<keyof UserPrivate, CustomObjectKey<keyof UserPrivateItem, boolean>>;

  listTypes: typeof ListType = ListType;
  navMenuType: NavMenuType = NavMenuType.collapse;
  ruleNames: UserPrivateNameItemLocal[] = [];

  peoplePlural: SimpleObject = PeoplePlural;

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
      .map(userId => this.getUser(userId))
      .filter((user, i) => i < this.getUserInListCount || this.getUserMoreState(rule, listType));
  }

  // Количество пользователей в одной строке списка
  private get getUserInListCount(): number {
    return UserInListCount[this.breakpoint];
  }

  // Оставшееся количество пользователей в списке
  getUsersMoreCount(rule: keyof UserPrivate, listType: ListType): number {
    const listTypeName: keyof UserPrivateItem = listType === ListType.white ? "whiteList" : "blackList";
    const count: number = ((this.form?.get(rule)?.get(listTypeName) as FormArray)?.value ?? [])
      .map(userId => this.getUser(userId))
      .length;
    const moreCount: number = count - this.getUserInListCount > 0 ? count - this.getUserInListCount : 0;
    // Вернуть количество
    return moreCount;
  }

  // Состояние просмотра полного списка
  getUserMoreState(rule: keyof UserPrivate, listType: ListType): boolean {
    return this.showAll[rule][listType] ?? false;
  }

  // Список доступных прав доступа
  private getAvailTypes(rule: UserPrivateNameItem): OptionData[] {
    if (!!rule?.availValues?.length) {
      return PrivateTypes.filter(({ key }) => rule.availValues.some(type => type.toString() === key));
    }
    // Все типы доступны
    else {
      return PrivateTypes;
    }
  }





  constructor(
    private accountService: AccountService,
    private screenService: ScreenService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog
  ) {
    this.defineData(true);
  }

  ngOnInit() {
    this.accountService.user$()
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
      const listTypeName: keyof UserPrivateItem = listType === ListType.white ? "whiteList" : "blackList";
      const userListIndex: number = ((this.form?.get(rule)?.get(listTypeName) as FormArray)?.value ?? [])
        .findIndex(userId => userId === id);
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

  // Изменить статус показа полного списка пользователей
  onShowMoreUsersChange(rule: keyof UserPrivate, listType: ListType): void {
    this.showAll[rule][listType] = !this.showAll[rule][listType];
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Открыть окно поиска пользователей
  onSearchOpen(rule: keyof UserPrivate, listType: ListType): void {
    const listTypeName: keyof UserPrivateItem = listType === ListType.white ? "whiteList" : "blackList";
    const subTitle: string = listType === ListType.white ?
      "Белый список" :
      "Черный список";
    // Открытие диалога
    PopupSearchUsersComponent.open(this.matDialog, { subTitle, rule, listTypeName }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => {
        if (!!userId) {
          (this.form?.get(rule)?.get(listTypeName) as FormArray).push(this.formBuilder.control(userId));
          // Сохранить настройки
          this.onSave();
        }
      });
  }





  // Создание формы
  private defineData(create: boolean = false): void {
    this.ruleNames = UserPrivateNames.map(rule => ({
      ...rule,
      optionData: this.getAvailTypes(rule)
    }));
    // Новая форма
    if (create) {
      const formDatas = this.ruleNames.reduce((o, r) => {
        const ruleItem: UserPrivateItem = this.user?.private[r.rule] ?? DefaultUserPrivItem;
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
      // Заполнить массив просмотра всех пользователей в списке
      this.showAll = this.ruleNames
        .map(({ rule }) => rule)
        .reduce((o, rule) => ({ ...o, [rule]: { [ListType.black]: false, [ListType.white]: false } }), {});
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
    const privateRules: UserPrivate = this.accountService.userPrivRulesConverter(this.user?.private);
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




// Локальный тип настроек
interface UserPrivateNameItemLocal extends UserPrivateNameItem {
  optionData: OptionData[];
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
