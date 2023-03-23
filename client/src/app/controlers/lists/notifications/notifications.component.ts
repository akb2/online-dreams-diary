import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from "@angular/core";
import { ScrollChangeEvent } from "@_controlers/scroll/scroll.component";
import { WaitObservable } from "@_datas/api";
import { CompareElementBySelector, CreateArray, ScrollElement } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { UniqueArray } from "@_helpers/objects";
import { User } from "@_models/account";
import { CustomObjectKey, SimpleObject } from "@_models/app";
import { Notification, NotificationActionType, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
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
  @Input() outerClickClose: boolean = true;

  @Output() showChange: EventEmitter<boolean> = new EventEmitter();

  @ViewChildren("notificationElm", { read: ElementRef }) notificationElms: QueryList<ElementRef>;

  notificationActionType: typeof NotificationActionType = NotificationActionType;

  user: User;
  notifications: Notification[];
  isAutorizedUser: boolean = false;
  private usersSubscribe: CustomObjectKey<number, User> = {};
  private readIgnore: number[] = [];

  private availToMoreLoad: boolean = true;
  private skip: number = 0;
  private limit: number = 15;
  private previousScroll: ScrollChangeEvent;

  listId: string = "notification-component-list";

  private outCloseAvail: boolean = false;
  private readWhaitTimer: number = 2500;

  private destroyed$: Subject<void> = new Subject();





  // Иконка уведомления
  notificationUser(notification: Notification): Observable<User> {
    return (!!notification?.data?.user ? this.accountService.user$(notification.data.user) : of(null)).pipe(
      takeUntil(this.destroyed$)
    );
  }

  // Функция проверки уведомления для обновления списка
  listTrackBy(index: number, notification: Notification): string {
    const dataStrings: string[] = [
      notification.id.toString(),
      notification.status.toString(),
      notification.createDate.toISOString(),
      notification.actionType,
      notification.link,
      notification.text,
      notification.userId.toString(),
      JSON.stringify(notification.data),
    ];
    // Объединить данные
    return dataStrings.join("-");
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
    // Загрузка уведомлений
    this.loadNotifications();
    // Поиск новых уведомлений
    this.notificationService.getNewNotifications()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(notification => {
        this.updateNotificationsList(notification);
        // Прочитать уведомление
        if (this.show) {
          this.onScrollChange(this.previousScroll);
        }
      });
    // Прослушивание закрытия уведомлений
    this.closeEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.show && changes.show.previousValue !== changes.show.currentValue && this.show) {
      this.showChange.emit(this.show);
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
        .filter(({ id }) => !this.readIgnore.includes(id))
        .filter(n => !!n && n.status === NotificationStatus.new);
      // Пометить все как прочитанное
      this.onReadNotifications(notifications);
    }
  }

  // Список пролистан до низа
  onScrolledToBottom(event: ScrollChangeEvent): void {
    if (this.availToMoreLoad) {
      this.loadNotifications();
    }
  }

  // Отметить уведомление как прочитанное
  onReadNotifications(notifications: Notification | Notification[]): void {
    notifications = Array.isArray(notifications) ? notifications : [notifications];
    const ids: number[] = notifications.map(({ id }) => id);
    // Если окно открыто
    if (this.show && !!notifications?.length) {
      this.readIgnore.push(...ids);
      // Подписка
      forkJoin({
        timer: timer(this.readWhaitTimer),
        responce: this.notificationService.readNotifications(ids)
      })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          ({ responce: { result } }) => {
            this.updateNotificationsList(result);
            // Убрать из списка игнора прочтения
            ids.forEach(id => {
              const index: number = this.readIgnore.findIndex(t => t === id);
              // Удалить блокировку прочтения
              this.readIgnore.splice(index, 1);
            });
          },
          () => ids.forEach(id => {
            const index: number = this.readIgnore.findIndex(t => t === id);
            // Удалить блокировку прочтения
            this.readIgnore.splice(index, 1);
          })
        );
    }
  }





  // Загрузка уведомлений
  private loadNotifications(): void {
    const search: Partial<NotificationSearchRequest> = {
      status: NotificationStatus.any,
      skip: this.skip,
      limit: this.limit
    };
    // Подписка
    this.notificationService.getList(search, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ count, result }) => {
        const listCount: number = UniqueArray([...this.notifications ?? [], ...result ?? []]).length;
        // Добавить уведомления в список
        this.updateNotificationsList(result);
        // Запретить дальнейшую загрузку истории
        this.availToMoreLoad = listCount < count;
      });
  }

  // Добавить уведомления в общий список
  private updateNotificationsList(notification: Notification | Notification[]): void {
    const newNotifications: Notification[] = Array.isArray(notification) ? notification : [notification];
    // Проверка массива
    this.notifications = this.notifications ?? [];
    // Добавление уведомлений в общий массив
    newNotifications
      .filter(n => !!n)
      .forEach(newNotification => this.addNotificationToList(newNotification));
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
        filter(avail => this.outCloseAvail && avail && this.outerClickClose)
      )
      .subscribe(() => this.onClose());
    // Закрытие уведомлений: при нажатии на ссылки
    fromEvent(document, "click")
      .pipe(
        takeUntil(this.destroyed$),
        filter(({ target }: Event) => CompareElementBySelector(target, "#" + this.listId + " a") && this.outerClickClose)
      )
      .subscribe(() => this.onClose());
    // Закрытие при скролле документа
    fromEvent(ScrollElement(), "scroll")
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onClose());
  }

  // Добавить уведомление в общий массив
  private addNotificationToList(notification: Notification): void {
    const index: number = this.notifications.findIndex(({ id }) => notification.id === id);
    // Заменить существующий
    if (index >= 0) {
      this.notifications[index] = notification;
      this.notifications = this.notifications.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
      this.changeDetectorRef.detectChanges();
    }
    // Добавить новое
    else {
      this.defineNotificationData(notification).subscribe(n => {
        this.skip += 1;
        this.notifications.push(n);
        this.notifications = this.notifications.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
        this.changeDetectorRef.detectChanges();
      });
    }
  }

  // Преобразование данных
  private defineNotificationData(notification: Notification): Observable<Notification> {
    const waitUser = () => !!notification.data.user && !this.usersSubscribe.hasOwnProperty(notification.data.user);
    // Загрузка данных о входящем пользователе
    if (waitUser()) {
      const userId: number = ParseInt(notification.data.user);
      // Загрузка данных о пользователе
      this.defineUser(userId);
    }
    // Вернуть подписку
    return WaitObservable(() => waitUser()).pipe(
      takeUntil(this.destroyed$),
      map(() => notification)
    );
  }

  // Загрузка данных о пользователе
  private defineUser(userId: number): void {
    if (userId > 0) {
      this.accountService.user$(userId)
        .pipe(
          takeUntil(this.destroyed$),
          filter(user => !!user)
        )
        .subscribe(user => {
          this.usersSubscribe[userId] = user;
          this.notifications = [...this.notifications];
          this.changeDetectorRef.detectChanges();
        });
    }
  }
}
