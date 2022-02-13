import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AppComponent } from "@app/app.component";
import { CardMenuItem } from "@_controlers/card-menu/card-menu.component";
import { User } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamDescription, DreamTitle } from "@_services/dream.service";





@Component({
  selector: "app-dream-list",
  templateUrl: "./dream-list.component.html",
  styleUrls: ["./dream-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamListComponent implements DoCheck, OnChanges {


  @Input() dreams: Dream[];

  defaultTitle: string = DreamTitle;
  defaultDescription: string = DreamDescription;
  today: Date = new Date();
  imagePrefix: string = "../../../../assets/images/backgrounds/";

  oldUser: User;
  dreamsMenuItems: CustomObjectKey<number, CardMenuItem[]> = {};





  // Текущий пользователь
  get user(): User {
    return AppComponent.user;
  };

  // Есть обложка
  isHasImage(dream: Dream): boolean {
    return dream.headerType === NavMenuType.full || dream.headerType === NavMenuType.short;
  }





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngDoCheck() {
    if (this.accountService.checkAuth && this.oldUser?.id !== this.user?.id) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dreams) {
      this.createMenu();
    }
  }





  // Удаление сновидения
  onDreamDelete(dream: Dream): void {
    console.log(dream);
  }





  // Ссылки на сновидение
  private createMenu(): void {
    this.dreamsMenuItems = {};
    // Заполнить список меню
    this.dreams.forEach(dream => {
      const menuItem: CardMenuItem[] = [];
      const divider: CardMenuItem = { delimeter: true };
      // Просмотр сновидения
      menuItem.push({
        icon: "visibility",
        title: "Просмотр",
        routerLink: "/diary/viewer/" + dream.id
      });
      // Разделитель
      menuItem.push(divider);
      // Для собственных сновидений
      if (dream.user.id === this.user?.id) {
        // Редактирование
        menuItem.push({
          icon: "edit",
          title: "Редактировать",
          routerLink: "/diary/editor/" + dream.id
        });
        // Удаление
        menuItem.push({
          icon: "edit",
          title: "Удалить",
          callback: this.onDreamDelete.bind(this, dream)
        });
      }
      // Для сновидений других пользователей
      else {
        // Профиль
        menuItem.push({
          icon: "account_circle",
          title: "Профиль автора",
          subTitle: dream.user.name + " " + dream.user.lastName,
          routerLink: "/profile/" + dream.user.id
        });
      }
      // Вернуть список пунктов
      this.dreamsMenuItems[dream.id] = menuItem;
    });
  }
}