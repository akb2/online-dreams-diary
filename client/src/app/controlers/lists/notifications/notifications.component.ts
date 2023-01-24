import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { CompareElementBySelector } from "@_datas/app";
import { User, UserSex } from "@_models/account";
import { CustomObject, IconColor, SimpleObject } from "@_models/app";
import { Notification } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { NotificationService } from "@_services/notification.service";
import { TokenService } from "@_services/token.service";
import { concatMap, filter, forkJoin, fromEvent, map, Observable, of, Subject, switchMap, take, takeUntil } from "rxjs";





@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationsComponent implements OnInit, OnDestroy {


  @Input() show: boolean = false;
  @Input() listStyles: SimpleObject = {};

  @Output() showChange: EventEmitter<boolean> = new EventEmitter();

  user: User;
  notifications: Notification[];
  isAutorizedUser: boolean = false;

  private lastId: number = 0;

  listId: string = "notification-component-list";

  private destroyed$: Subject<void> = new Subject();





  // Преобразование данных
  private notificationConvert(notification: Notification): Observable<Notification> {
    return of(notification).pipe(
      takeUntil(this.destroyed$),
      concatMap(
        ({ data }) => !!data?.user ? this.accountService.user$(data.user).pipe(take(1)) : of(null),
        (notification, user) => ({ notification, user })
      ),
      map(({ notification, user }) => {
        if (!!user) {
          Object.entries({
            ...user,
            sexLetter: user.sex === UserSex.Female ? "а" : ""
          })
            .filter(([, v]) => typeof v === "boolean" || typeof v === "string" || typeof v === "number" || v instanceof Date)
            .forEach(([k, v]) => notification.text = this.notificationTextReplace(notification.text, "user." + k, v));
        }
        // Вернуть уведомление
        return notification;
      })
    );
  }

  // Иконка уведомления
  notificationAdvance(notification: Notification): NotificationAdvance {
    const icon: string = NotificationIcons.hasOwnProperty(notification.actionType) ?
      NotificationIcons[notification.actionType] :
      NotificationIcons.default;
    const iconColor: IconColor = NotificationColors.hasOwnProperty(notification.actionType) ?
      NotificationColors[notification.actionType] :
      NotificationColors.default;
    const useImage: boolean = NotificationImages.hasOwnProperty(notification.actionType) ?
      NotificationImages[notification.actionType] :
      NotificationImages.default;
    // Данные о пользователе
    const user: Observable<User> = (!!notification?.data?.user ? this.accountService.user$(notification.data.user) : of(null)).pipe(takeUntil(this.destroyed$));
    // Вернуть данные
    return { icon, iconColor, useImage, user };
  }

  // Замена переменных в тексте
  private notificationTextReplace(text: string, varName: string, varValue: any): string {
    varName = varName.replace(".", "\\.");
    // Переставить знаяения
    if (typeof varValue === "boolean" || typeof varValue === "string" || typeof varValue === "number" || varValue instanceof Date) {
      text = text.replace(new RegExp("\\$\{" + varName + "\}", "gmi"), varValue.toString());
      text = text.replace(new RegExp("\{\{" + varName + "\}\}", "gmi"), varValue.toString());
    }
    // Ничего не менять
    return text;
  }





  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private notificationService: NotificationService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.isAutorizedUser = this.tokenService.checkAuth;
        this.changeDetectorRef.detectChanges();
      });
    // Синхронизация уведомлений
    this.notificationService.notifications$(true)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(notifications => forkJoin(notifications.map(notification => this.notificationConvert(notification))))
      )
      .subscribe(notifications => {
        this.notifications = notifications.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
    // Закрытие уведомлений
    fromEvent(document, "click")
      .pipe(
        takeUntil(this.destroyed$),
        filter(({ target }: Event) => CompareElementBySelector(target, "#" + this.listId + " a"))
      )
      .subscribe(() => this.onClose());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Закрыть уведомления
  onClose(): void {
    this.show = false;
    this.showChange.emit(this.show);
    this.changeDetectorRef.detectChanges();
  }





  // Загрузка уведомлений
  private loadNotifications(): void {
  }
}





// Дополнительные данные уведомления
interface NotificationAdvance {
  icon: string;
  iconColor: IconColor;
  user?: Observable<User>;
  useImage?: boolean;
}

// Иконка уведомления
const NotificationIcons: SimpleObject = {
  default: "notifications_active",
  "add_to_friend": "person_add"
};

// Цвет уведомления
const NotificationColors: CustomObject<IconColor> = {
  default: "disabled",
  "add_to_friend": "primary"
};

// Картинка вместо иконки
const NotificationImages: CustomObject<boolean> = {
  default: false,
  "add_to_friend": true
};
