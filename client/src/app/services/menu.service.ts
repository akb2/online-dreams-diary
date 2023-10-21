import { MenuItems } from "@_datas/menu";
import { IsInEnum } from "@_helpers/app";
import { CompareArrays } from "@_helpers/objects";
import { GetLanguageFromDomainSetting } from "@_helpers/translate";
import { User } from "@_models/account";
import { MenuItem, MenuItemsListAuth, MenuItemsListDevices } from "@_models/menu";
import { Language } from "@_models/translate";
import { AccountService } from "@_services/account.service";
import { FriendService } from "@_services/friend.service";
import { NotificationService } from "@_services/notification.service";
import { ScreenService } from "@_services/screen.service";
import { Injectable, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { translateLanguageSelector, translateSaveLanguageAction } from "@app/reducers/translate";
import { Store } from "@ngrx/store";
import { BehaviorSubject, Observable, Subject, filter, map, pairwise, startWith, takeUntil } from "rxjs";





@Injectable()

export class MenuService implements OnDestroy {


  private user: User;
  private notificationsCount: number = -1;
  private language: Language;

  isMobile: boolean = false;

  private menuItems: BehaviorSubject<MenuItem[]> = new BehaviorSubject<MenuItem[]>([]);

  readonly menuItems$: Observable<MenuItem[]>;
  private destroyed$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private router: Router,
    private screenService: ScreenService,
    private store: Store
  ) {
    this.menuItems$ = this.menuItems.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(undefined),
      pairwise(),
      filter(([prev, next]) => !CompareArrays(prev, next)),
      map(([, next]) => next)
    );
    // Подписка на количество уведомлений
    this.notificationService.newNotificationsCount$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(count => {
        if (this.notificationsCount >= 0 && this.notificationsCount < count && count > 0) {
          this.playSound();
        }
        // Обновить данные
        this.notificationsCount = count;
        // Обновить меню
        this.createMenuItems();
      });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        // Обновить меню
        this.createMenuItems();
      });
    // Подписка на текущего пользователя
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        // Обновить меню
        this.createMenuItems();
      });
    // Подписка на изменение роута
    this.router.events
      .pipe(
        takeUntil(this.destroyed$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => this.createMenuItems());
    // Смена языка
    this.store.select(translateLanguageSelector)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(language => {
        this.language = language;
        // Обновить меню
        this.createMenuItems();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.menuItems.complete();
  }





  // Выход из системы
  private onLogOut(): void {
    this.accountService.quit();
    this.friendService.quit();
    this.notificationService.quit();
  }

  // Смена языки
  private onChangeLanguage(mixedLanguage: string): void {
    const language: Language = IsInEnum(mixedLanguage, Language)
      ? mixedLanguage as Language
      : GetLanguageFromDomainSetting();
    // Смена языка
    this.store.dispatch(translateSaveLanguageAction({ language }));
  }





  // Сформировать список меню
  createMenuItems(): void {
    const deviceKey: keyof MenuItemsListDevices = this.isMobile ? "mobile" : "desktop";
    const authKeys: keyof MenuItemsListAuth = this.accountService.checkAuth ? "auth" : "notAuth";
    const menuItems: MenuItem[] = [
      ...this.arrayClone(MenuItems[deviceKey].any),
      ...this.arrayClone(MenuItems[deviceKey][authKeys])
    ];
    // Отсортировать меню
    menuItems.sort((itemA, itemB) => this.sortMenu(itemA, itemB));
    menuItems.map(item => item?.children?.sort((itemA, itemB) => this.sortMenu(itemA, itemB)));
    // Установить методы и значения
    menuItems.forEach(item => this.setValues(item));
    menuItems.forEach(item => item?.children?.forEach(subItem => this.setValues(subItem)));
    // Активные элементы
    menuItems.forEach(item => {
      item.children?.forEach(subItem => subItem.active = this.checkActive(subItem));
      item.active = this.checkActive(item);
    });
    // Запомнить пункты меню
    this.menuItems.next(menuItems);
  }

  // Отсортировать массив меню
  private sortMenu(itemA: MenuItem, itemB: MenuItem): number {
    itemA.sort = itemA.sort || 0;
    itemB.sort = itemB.sort || 0;
    // Ничего не делать
    return itemA.sort > itemB.sort ? 1 : (itemA.sort < itemB.sort ? -1 : 0);
  }

  // Активные пункты
  private checkActive(item: MenuItem): boolean {
    if (!item?.neverActive) {
      let active: boolean = !!item?.callback && !item?.children?.length ?
        !!item?.active :
        false;
      // Есть потомки
      if (!!item?.children?.length) {
        item.children?.map(subItem => active = this.checkActive(subItem) ? true : active);
      }
      // Есть ссылка
      if (item.link) {
        let url: string = this.router.url;
        url = (url.split("?"))[0];
        // Активность
        return item.link === url ? true : active;
      }
      // Проверить
      return active;
    }
    // Не активен
    return false;
  }

  // Установить методы и значения
  private setValues(item: MenuItem): void {
    const currentUserIDRegExp: RegExp = new RegExp("(:currentUserID)", "gm");
    // Выставить текущий URL
    if (currentUserIDRegExp.test(item.link)) {
      item.link = item.link.replace(currentUserIDRegExp, this.user?.id?.toString() ?? "0");
    }
    // Выход
    if (item?.id === "quit") {
      item.callback = this.onLogOut.bind(this);
    }
    // Количество уведомлений
    else if (item?.id === "notifications") {
      item.counter = Math.max(0, this.notificationsCount);
    }
    // Моя страница
    else if (item?.id === "my-profie" && !!this.user?.avatars?.small) {
      item.image = this.user.avatars.small;
    }
    // Текущий язык
    else if (item?.id === "current-language" || item?.id === "current-language-mobile") {
      item.icon = "language-" + this.language;
    }
    // Сменить язык
    else if (item?.id === "change-language") {
      const mixedLanguage: string = item?.linkParams?.language;
      // Свойства
      item.active = mixedLanguage === this.language;
      item.callback = this.onChangeLanguage.bind(this, mixedLanguage);
    }
  }

  // Клонирование массива
  private arrayClone(mixedValue: any): any {
    // Массив
    if (Array.isArray(mixedValue)) {
      return mixedValue.slice(0).map(v => this.arrayClone(v));
    }
    // Объект
    else if (typeof mixedValue === "object") {
      return JSON.parse(JSON.stringify(mixedValue));
    }
    // Простые
    else {
      return mixedValue;
    }
  }

  // Воспроизвести звук
  private playSound(): void {
    const audio: HTMLAudioElement = new Audio();
    audio.src = "/assets/sounds/notification.mp3";
    audio.load();
    audio.play();
  }
}
