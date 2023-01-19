import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { CardMenuItem } from "@_controlers/card-menu/card-menu.component";
import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { DreamStatuses } from "@_datas/dream";
import { DreamDescription, DreamTitle } from "@_datas/dream-map-settings";
import { User, UserSex } from "@_models/account";
import { CustomObjectKey, SimpleObject } from "@_models/app";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { SnackbarService } from "@_services/snackbar.service";
import { filter, Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-dream-list",
  templateUrl: "./dream-list.component.html",
  styleUrls: ["./dream-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamListComponent implements OnInit, OnChanges {


  @Input() dreams: Dream[];
  @Input() sourcePlace: string = "";
  @Input() oneLine: boolean = false;
  @Input() showProfile: boolean = true;
  @Input() elmsPerLine: number = 4;

  @Output() dreamDelete: EventEmitter<void> = new EventEmitter<void>();

  defaultTitle: string = DreamTitle;
  defaultDescription: string = DreamDescription;
  today: Date = new Date();
  imagePrefix: string = "../../../../assets/images/backgrounds/";

  user: User;
  dreamsMenuItems: CustomObjectKey<number, CardMenuItem[]> = {};

  private destroy$: Subject<void> = new Subject<void>();





  // Есть обложка
  isHasImage(dream: Dream): boolean {
    return dream.headerType === NavMenuType.full || dream.headerType === NavMenuType.short;
  }

  // Ссылка на просмотр
  viewerQueryParams(dream: Dream): SimpleObject {
    const data: SimpleObject = {};
    // Метка посещения
    if (this.sourcePlace.length > 0) {
      data.from = this.sourcePlace;
    }
    // Вернуть объект
    return data;
  }

  // Проверка пола
  userIsMale(user: User): boolean {
    return user.sex === UserSex.Male;
  }

  // Подробные сведения о приватности сновидения
  getDreamPrivate(dream: Dream): OptionData {
    return DreamStatuses.find(({ key }) => key === dream.status.toString()) ?? DreamStatuses[0];
  }





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Текущий пользователь
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.createMenu();
      });
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
      const menuItemMain: CardMenuItem[] = [];
      const menuItemAdvance: CardMenuItem[] = [];
      const divider: CardMenuItem = { delimeter: true };
      // Просмотр сновидения
      menuItemMain.push({
        icon: "visibility",
        title: "Просмотр",
        routerLink: "/diary/viewer/" + dream.id
      });
      // Для собственных сновидений
      if (dream.user.id === this.user?.id) {
        // Редактирование
        menuItemAdvance.push({
          icon: "edit",
          title: "Редактировать",
          routerLink: "/diary/editor/" + dream.id,
          queryParams: this.viewerQueryParams(dream)
        });
        // Удаление
        menuItemAdvance.push({
          icon: "delete",
          title: "Удалить",
          callback: this.onDreamDelete.bind(this, dream)
        });
      }
      // Для сновидений других пользователей
      else {
        // Профиль
        // if (this.showProfile) {
        //   menuItemAdvance.push({
        //     icon: "account_circle",
        //     title: "Профиль автора",
        //     subTitle: dream.user.name + " " + dream.user.lastName,
        //     routerLink: "/profile/" + dream.user.id
        //   });
        // }
      }
      // Объединить список пунктов
      const menuItem: CardMenuItem[] = [
        ...menuItemMain,
        ...(!!menuItemMain?.length && !!menuItemAdvance?.length ? [divider] : []),
        ...menuItemAdvance
      ];
      // Вернуть список пунктов
      this.dreamsMenuItems[dream.id] = menuItem?.length > 1 ? menuItem : [];
      this.changeDetectorRef.detectChanges();
    });
  }
}
