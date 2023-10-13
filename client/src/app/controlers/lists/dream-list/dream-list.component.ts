import { CardMenuItem } from "@_controlers/card-menu/card-menu.component";
import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamDescription, DreamTitle } from "@_datas/dream-map-settings";
import { User, UserSex } from "@_models/account";
import { CustomObjectKey, SimpleObject } from "@_models/app";
import { Dream, DreamMode, DreamMood, DreamType } from "@_models/dream";
import { OptionData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { ScreenService } from "@_services/screen.service";
import { SnackbarService } from "@_services/snackbar.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subject, concatMap, filter, takeUntil } from "rxjs";





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
  @Input() highlightWords: string[];
  @Input() inAttachment: boolean = false;

  @Output() dreamDelete: EventEmitter<void> = new EventEmitter<void>();

  defaultTitle: string = DreamTitle;
  defaultDescription: string = DreamDescription;
  today: Date = new Date();
  imagePrefix: string = "../../../../assets/images/backgrounds/";

  user: User;
  dreamsMenuItems: CustomObjectKey<number, CardMenuItem[]> = {};

  isMobile: boolean = false;

  private destroyed$: Subject<void> = new Subject<void>();





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

  // Функция проверки пользователя для обновления списка
  listTrackBy(index: number, dream: Dream): string {
    const dataStrings: string[] = [
      dream.id.toString(),
      dream.headerType.toString(),
      dream.headerBackground.id.toString(),
      (dream.headerType === NavMenuType.full || dream.headerType === NavMenuType.short) ? "true" : "false",
      dream.title,
      dream.createDate.toISOString(),
      dream.description,
      dream.keywords.join(","),
      dream.user?.id?.toString(),
      dream.status.toString()
    ];
    // Объединить данные
    return dataStrings.join("-");
  }

  // Тип сновидения
  getDreamType(dream: Dream): OptionData {
    return DreamTypes.find(({ key }) => key === dream.type.toString()) ?? DreamTypes.find(({ key }) => key === DreamType.Simple.toString());
  }

  // Настроение сновидения
  getDreamMood(dream: Dream): OptionData {
    return DreamMoods.find(({ key }) => key === dream.mood.toString()) ?? DreamMoods.find(({ key }) => key === DreamMood.Nothing.toString());
  }

  // Есть карта сновидений
  dreamHasMap(dream: Dream): boolean {
    return dream.mode === DreamMode.map || dream.mode === DreamMode.mixed;
  }





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private snackbarService: SnackbarService,
    private screenService: ScreenService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Текущий пользователь
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.createMenu();
      });
    // Тип экрана
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
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
    PopupConfirmComponent.open(this.matDialog, { title, subTitle, text }).afterClosed()
      .pipe(
        takeUntil(this.destroyed$),
        filter(r => !!r),
        concatMap(() => this.dreamService.delete(dream.id)),
        filter(del => !!del)
      )
      .subscribe(() => {
        this.dreamDelete.emit();
        // Уведомление об удалении
        this.snackbarService.open({
          message: "Сновидение \"" + dream.title + "\" успешно удалено",
          mode: "success"
        });
      });
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
          icon: "stylus",
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
