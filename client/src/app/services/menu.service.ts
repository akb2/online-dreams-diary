import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { MenuItem, MenuItems, MenuItemsListAuth, MenuItemsListDevices } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { TokenService } from "@_services/token.service";
import { Subject, takeUntil } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class MenuService implements OnDestroy {


  menuItems: MenuItem[] = [];

  isMobile: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private router: Router,
    private screenService: ScreenService
  ) {
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => this.isMobile = isMobile);
  }

  ngOnDestroy(): void {
  }





  // Выход из системы
  private onLogOut(): void {
    this.tokenService.deleteAuth();
  }





  // Сформировать список меню
  createMenuItems(): void {
    const deviceKey: keyof MenuItemsListDevices = this.isMobile ? "mobile" : "desktop";
    const authKeys: keyof MenuItemsListAuth = this.accountService.checkAuth ? "auth" : "notAuth";
    // Заполнить список меню
    this.menuItems = [...MenuItems[deviceKey].any, ...MenuItems[deviceKey][authKeys]];
    // Отсортировать меню
    this.menuItems.sort((itemA, itemB) => this.sortMenu(itemA, itemB));
    this.menuItems.forEach(item => item?.children?.sort((itemA, itemB) => this.sortMenu(itemA, itemB)));
    // Установить методы и значения
    this.menuItems.forEach(item => this.setValues(item));
    this.menuItems.forEach(item => item?.children?.forEach(subItem => this.setValues(subItem)));
    // Активные элементы
    this.menuItems.forEach(item => {
      item.children?.forEach(subItem => subItem.active = this.checkActive(subItem));
      item.active = this.checkActive(item);
    });
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
      item.link = item.link.replace(currentUserIDRegExp, this.tokenService.id);
    }
    // Выход
    else if (item.id === "quit") {
      item.callback = this.onLogOut.bind(this);
    }
  }
}
