import { ScrollChangeEvent } from "@_controlers/scroll/scroll.component";
import { CompareElementBySelector, CreateArray, ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { UniqueArray } from "@_helpers/objects";
import { User } from "@_models/account";
import { CustomObjectKey, SimpleObject } from "@_models/app";
import { Notification, NotificationActionType, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { NotificationService } from "@_services/notification.service";
import { ScrollService } from "@_services/scroll.service";
import { TokenService } from "@_services/token.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from "@angular/core";
import { Observable, Subject, concatMap, filter, forkJoin, fromEvent, map, of, take, takeUntil, tap, timer } from "rxjs";





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
  users: CustomObjectKey<number, User> = {};
  isAutorizedUser: boolean = false;
  private readIgnore: number[] = [];

  private availToMoreLoad: boolean = true;
  private listSkip: number = 0;
  private listLimit: number = 15;
  private previousScroll: ScrollChangeEvent;

  listId: string = "notification-component-list";

  private outCloseAvail: boolean = false;
  private readWaitTimer: number = 2500;

  notifications$: Observable<Notification[]>;

  private destroyed$: Subject<void> = new Subject();





  // Иконка уведомления
  notificationUser(notification: Notification): User {
    const userId: number = ParseInt(notification?.data?.user);
    // Информация о пользователе
    return this.users?.[userId];
  }

  // Функция проверки уведомления для обновления списка
  listTrackBy(index: number, notification: Notification): string {
    const dataStrings: string[] = [
      notification.id.toString(),
      notification.status.toString(),
      ToDate(notification.createDate).toISOString(),
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
    private scrollService: ScrollService,
    private notificationService: NotificationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.notifications$ = this.notificationService.notifications$.pipe(
      takeUntil(this.destroyed$),
      map(notifications => notifications.filter((n, k) => k < this.listSkip + this.listLimit)),
      concatMap(
        notifications => {
          const userIds: number[] = UniqueArray(notifications
            .map(({ data }) => ParseInt(data.user))
            .filter(userId => userId > 0 && !this.users[userId] && this.users[userId] !== null)
          );
          // Зарезервировать списки ID
          userIds.forEach(userId => this.users[userId] = null);
          // Подписчик
          const observable: Observable<User[]> = forkJoin(userIds.map(userId => this.accountService.user$(userId).pipe(
            take(1),
            takeUntil(this.destroyed$),
            tap(user => {
              this.users[user.id] = user;
              // Обновить
              changeDetectorRef.detectChanges();
            })
          )));
          // Подписчик
          return !!userIds.length ? observable : of([]);
        },
        data => data
      )
    );
  }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.isAutorizedUser = this.tokenService.checkAuth;
        this.changeDetectorRef.detectChanges();
      });
    // Загрузить список
    this.loadNotifications();
    // Отслеживать закрытие списка
    this.closeEvents();
    // Ожидание новых уведомлений
    this.waitNotifications();
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
  private onClose(): void {
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
      this.notifications$
        .pipe(
          takeUntil(this.destroyed$),
          take(1)
        )
        .subscribe(allNotifications => {
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
            .map(({ key }) => allNotifications[key])
            .filter(({ id }) => !this.readIgnore.includes(id))
            .filter(n => !!n && n.status === NotificationStatus.new);
          // Пометить все как прочитанное
          this.onReadNotifications(notifications);
        });
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
    // Параметры
    const ids: number[] = notifications.map(({ id }) => id);
    const removeReadIgnore = () => ids.forEach(id => {
      const index: number = this.readIgnore.findIndex(t => t === id);
      // Удалить блокировку прочтения
      this.readIgnore.splice(index, 1);
    });
    // Если окно открыто
    if (this.show && !!notifications?.length) {
      this.readIgnore.push(...ids);
      // Подписка
      forkJoin({
        timer: timer(this.readWaitTimer),
        responce: this.notificationService.readNotifications(ids)
      })
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => removeReadIgnore(),
          () => removeReadIgnore()
        );
    }
  }





  // Загрузить уведомления
  private loadNotifications(): void {
    if (this.availToMoreLoad) {
      const search: Partial<NotificationSearchRequest> = {
        status: NotificationStatus.any,
        skip: this.listSkip,
        limit: this.listLimit
      };
      // Запрос
      this.notificationService.getList(search, ["0002"])
        .pipe(
          takeUntil(this.destroyed$),
          concatMap(
            () => this.notifications$.pipe(take(1)),
            ({ result, count }, notifications) => ({ count, result, notifications })
          )
        )
        .subscribe(({ count, result, notifications }) => {
          const listCount: number = notifications.length;
          // Запретить дальнейшую загрузку истории
          this.listSkip += result.length;
          this.availToMoreLoad = listCount < count;
          // Обновить
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  // Ожидание новых уведомлений
  private waitNotifications(): void {
    this.notificationService.getNewNotifications()
      .pipe(
        takeUntil(this.destroyed$),
        filter(() => this.show)
      )
      .subscribe(() => this.onScrollChange(this.previousScroll));
  }

  // События закрытия уведомлений
  private closeEvents(): void {
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
    this.scrollService.onAlwaysScroll()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onClose());
  }
}
