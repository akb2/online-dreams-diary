import { Injectable, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { MenuItems } from "@_datas/menu";
import { CompareArrays } from "@_helpers/objects";
import { User } from "@_models/account";
import { MenuItem, MenuItemsListAuth, MenuItemsListDevices } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { FriendService } from "@_services/friend.service";
import { NotificationService } from "@_services/notification.service";
import { ScreenService } from "@_services/screen.service";
import { BehaviorSubject, filter, map, Observable, pairwise, startWith, Subject, takeUntil } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class MenuService implements OnDestroy {


  private user: User;
  private notificationsCount: number = -1;

  isMobile: boolean = false;

  private menuItems: BehaviorSubject<MenuItem[]> = new BehaviorSubject<MenuItem[]>([]);

  readonly menuItems$: Observable<MenuItem[]>;
  private destroyed$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private router: Router,
    private screenService: ScreenService
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
        if (this.notificationsCount >= 0 && this.notificationsCount < count) {
          this.playSound();
        }
        // Обновить данные
        this.notificationsCount = count;
        this.createMenuItems();
      });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.createMenuItems();
      });
    // Подписка на текущего пользователя
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.createMenuItems();
      });
    // Подписка на изменение роута
    this.router.events
      .pipe(
        takeUntil(this.destroyed$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => this.createMenuItems());
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
    let active: boolean = false;
    // Есть потомки
    if (item.children) {
      item.children?.map(subItem => active = this.checkActive(subItem) ? true : active);
    }
    // Есть ссылка
    if (item.link) {
      let url: string = this.router.url;
      url = (url.split("?"))[0];
      // Активность
      return item.link === url ? true : active;
    }
    // Не активен
    return active;
  }

  // Установить методы и значения
  private setValues(item: MenuItem): void {
    const currentUserIDRegExp: RegExp = new RegExp("(:currentUserID)", "gm");
    // Выставить текущий URL
    if (currentUserIDRegExp.test(item.link)) {
      item.link = item.link.replace(currentUserIDRegExp, this.user?.id?.toString() ?? "0");
    }
    // Выход
    else if (item.id === "quit") {
      item.callback = this.onLogOut.bind(this);
    }
    // Количество уведомлений
    else if (item.id === "notifications") {
      item.counter = Math.max(0, this.notificationsCount);
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
