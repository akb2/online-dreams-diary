import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AppComponent } from "@app/app.component";
import { CardMenuItem } from "@_controlers/card-menu/card-menu.component";
import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { User } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamDescription, DreamService, DreamTitle } from "@_services/dream.service";
import { SnackbarService } from "@_services/snackbar.service";
import { filter } from "rxjs";





@Component({
  selector: "app-dream-list",
  templateUrl: "./dream-list.component.html",
  styleUrls: ["./dream-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamListComponent implements DoCheck, OnChanges {


  @Input() dreams: Dream[];

  @Output() dreamDelete: EventEmitter<void> = new EventEmitter<void>();

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
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog
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
    const title: string = "Удаление сновидения";
    const subTitle: string = "";
    const text: string = "Вы действительно желаете удалить сновидение \"" + (dream.title || this.defaultTitle) + "\"? Сновидение нельзя будет восстановить.";
    // Открыть окно
    PopupConfirmComponent.open(this.matDialog, { title, subTitle, text }).afterClosed().pipe(filter(r => !!r)).subscribe(r => this.dreamService.delete(dream.id).subscribe(r => {
      if (r) {
        this.dreamDelete.emit();
        // Уведомление об удалении
        this.snackbarService.open({
          message: "Сновидение \"" + dream.title + "\" успешно удалено",
          mode: "success"
        });
      }
    }));
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
          icon: "delete",
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