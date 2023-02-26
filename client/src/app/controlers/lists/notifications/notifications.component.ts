import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from "@angular/core";
import { ScrollChangeEvent } from "@_controlers/scroll/scroll.component";
import { CompareElementBySelector, CreateArray } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { User, UserSex } from "@_models/account";
import { CustomObject, CustomObjectKey, IconColor, SimpleObject } from "@_models/app";
import { Notification, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { NotificationService } from "@_services/notification.service";
import { TokenService } from "@_services/token.service";
import { filter, forkJoin, fromEvent, map, Observable, of, Subject, takeUntil, timer } from "rxjs";





@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationsComponent implements OnInit, OnChanges, OnDestroy {


  @Input() show: boolean = false;
  @Input() listStyles: SimpleObject = {};

  @Output() showChange: EventEmitter<boolean> = new EventEmitter();

  @ViewChildren("notificationElm") notificationElms: QueryList<ElementRef>;

  user: User;
  notifications: Notification[];
  isAutorizedUser: boolean = false;
  private usersSubscribe: CustomObjectKey<number, User> = {};

  private skip: number = 0;
  private limit: number = 20;
  private previousScroll: ScrollChangeEvent;

  listId: string = "notification-component-list";
  private outCloseAvail: boolean = false;

  private readWhaitTimer: number = 2500;

  private destroyed$: Subject<void> = new Subject();





  // Преобразование данных
  private notificationConvert(notification: Notification): void {
    if (!!notification.data.user && !this.usersSubscribe.hasOwnProperty(notification.data.user)) {
      this.accountService.user$(notification.data.user)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(user => {
          if (!!user) {
            this.notifications.forEach((notification, k) => notification?.data?.user === user.id ?
              this.notifications[k] = this.notificationSearchTextReplace(notification, user) :
              null
            );
            // Обновить
            this.changeDetectorRef.detectChanges();
          }
          // Запомнить подписку
          this.usersSubscribe[notification.data.user] = user;
        });
    }
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

  // Поиск и замена всех переменных в тексте
  private notificationSearchTextReplace(notification: Notification, user: User): Notification {
    Object.entries({ ...user, sexLetter: user.sex === UserSex.Female ? "а" : "" })
      .filter(([, v]) => typeof v === "boolean" || typeof v === "string" || typeof v === "number" || v instanceof Date)
      .forEach(([k, v]) => notification.text = this.notificationTextReplace(notification.text, "user." + k, v))
    // Вернуть уведомление
    return notification;
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
    this.loadNotifications();
    // Поиск новых уведомлений
    this.notificationService.getNewNotifications()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(notification => {
        this.updateNotificationsList(notification);
        // Прочитать уведомление
        if (this.show) {
          this.onReadNotifications(notification);
        }
      });
    // Прослушивание закрытия уведомлений
    this.closeEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.show && changes.show.previousValue !== changes.show.currentValue && this.show) {
      this.onScrollChange(this.previousScroll);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Закрыть уведомления
  onClose(): void {
    if (this.show) {
      this.show = false;
      this.outCloseAvail = false;
      this.showChange.emit(this.show);
      this.changeDetectorRef.detectChanges();
    }
  }

  // Изменение скролла
  onScrollChange(event: ScrollChangeEvent): void {
    this.previousScroll = event;
    // Список не пуст
    if (!!this.notificationElms?.length) {
      const notifications: Notification[] = CreateArray(this.notificationElms.length)
        .map(key => ({ elm: this.notificationElms.get(key)?.nativeElement as HTMLElement, key }))
        .filter(({ elm }) => !!elm)
        .map(({ elm, key }) => {
          const styles: CSSStyleDeclaration = getComputedStyle(elm);
          const top: number = elm.offsetTop;
          const bottom: number = elm.offsetTop + elm.clientHeight + ParseInt(styles.borderTopWidth) + ParseInt(styles.borderBottomWidth);
          // Вернуть данные
          return { elm, top, bottom, key };
        })
        .filter(({ top, bottom }) => top < event.y + event.viewHeight && bottom > event.y)
        .map(({ key }) => this.notifications[key])
        .filter(n => !!n && n.status === NotificationStatus.new);
      // Пометить все как прочитанное
      this.onReadNotifications(notifications);
    }
  }

  // Отметить уведомление как прочитанное
  onReadNotifications(notifications: Notification | Notification[]): void {
    notifications = Array.isArray(notifications) ? notifications : [notifications];
    // Если окно открыто
    if (this.show && !!notifications?.length) {
      forkJoin({
        timer: timer(this.readWhaitTimer),
        responce: of(notifications.map(n => ({ ...n, status: NotificationStatus.read })))
      })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(({ responce: notifications }) => this.updateNotificationsList(notifications));
    }
  }





  // Загрузка уведомлений
  private loadNotifications(): void {
    const search: NotificationSearchRequest = {
      status: NotificationStatus.any,
      skip: this.skip,
      limit: this.limit
    };
    // Подписка
    this.notificationService.getList(search, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ result }) => this.updateNotificationsList(result));
  }

  // Добавить уведомления в общий список
  private updateNotificationsList(notification: Notification | Notification[]): void {
    const newNotifications: Notification[] = Array.isArray(notification) ? notification : [notification];
    // Проверка массива
    this.notifications = this.notifications ?? [];
    // Добавление уведомлений в общий массив
    newNotifications
      .filter(n => !!n)
      .forEach(newNotification => {
        const index: number = this.notifications.findIndex(({ id }) => newNotification.id === id);
        // Обновить текст, если данные о пользователе уже доступны
        if (!!newNotification?.data?.user && this.usersSubscribe.hasOwnProperty(newNotification.data.user)) {
          newNotification = this.notificationSearchTextReplace(newNotification, this.usersSubscribe[newNotification.data.user]);
        }
        // Заменить существующий
        if (index >= 0) {
          this.notifications[index] = newNotification;
        }
        // Добавить
        else {
          this.notifications.push(newNotification);
          this.notificationConvert(newNotification);
        }
      });
    // Сортировка
    this.notifications = this.notifications.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // События закрытия уведомлений
  private closeEvents(): void {
    // Закрытие уведомлений: мышка нажата
    fromEvent(document, "mousedown")
      .pipe(
        takeUntil(this.destroyed$),
        map(({ target }: Event) => !CompareElementBySelector(target, "#" + this.listId + ", .menu-list__item-link#notifications"))
      )
      .subscribe(avail => this.outCloseAvail = avail);
    // Закрытие уведомлений: мышка отпущена
    fromEvent(document, "mouseup")
      .pipe(
        takeUntil(this.destroyed$),
        map(({ target }: Event) => !CompareElementBySelector(target, "#" + this.listId + ", .menu-list__item-link#notifications")),
        filter(avail => this.outCloseAvail && avail)
      )
      .subscribe(() => this.onClose());
    // Закрытие уведомлений: при нажатии на ссылки
    fromEvent(document, "click")
      .pipe(
        takeUntil(this.destroyed$),
        filter(({ target }: Event) => CompareElementBySelector(target, "#" + this.listId + " a"))
      )
      .subscribe(() => this.onClose());
    // Закрытие при скролле документа
    fromEvent(document, "scroll")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onClose());
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
