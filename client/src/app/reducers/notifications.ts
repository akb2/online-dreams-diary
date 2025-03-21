import { AnyToDate } from "@_datas/app";
import { Notification, NotificationStatus } from "@_models/notification";
import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";



// Название ключа в сторе
export const NOTIFICATIONS_KEY = "notifications";

// Интерфейс состояния
export interface NotificationsState {
  list: Notification[];
}

// Начальное состояние
export const notificationsInitialState: NotificationsState = {
  list: []
};



// Инициализация уведомлений из стора
export const notificationsInitAction = createAction(
  "[NOTIFICATIONS] Init notifications",
  props<{ notifications: Notification[] }>()
);

// Добавить одно уведомление
export const notificationsAddOneAction = createAction(
  "[NOTIFICATIONS] Add a notification",
  props<{ notification: Notification }>()
);

// Добавить несколько уведомлений
export const notificationsAddSomeAction = createAction(
  "[NOTIFICATIONS] Add some notifications",
  props<{ notifications: Notification[] }>()
);

// Заменить весь список
export const notificationsReplaceAction = createAction(
  "[NOTIFICATIONS] Replace notifications",
  props<{ notifications: Notification[] }>()
);

// Очистить список
export const notificationsClearAction = createAction(
  "[NOTIFICATIONS] Clear notifications"
);

// Создание стейта
export const notificationsReducer = createReducer(
  notificationsInitialState,
  // Инициализация уведомлений из стора
  on(notificationsInitAction, (state, { notifications }) => ({
    ...state,
    list: sortNotifications([...notifications])
  })),
  // Добавить одно уведомление
  on(notificationsAddOneAction, (state, { notification }) => ({
    ...state,
    list: addOrUpdateNotification([...state.list], notification)
  })),
  // Добавить несколько уведомлений
  on(notificationsAddSomeAction, (state, { notifications: newNotifications }) => ({
    ...state,
    list: newNotifications.reduce((o, notification) => addOrUpdateNotification(o, notification), [...state.list])
  })),
  // Заменить весь список
  on(notificationsReplaceAction, (state, { notifications }) => ({
    ...state,
    list: sortNotifications([...notifications])
  })),
  // Очистить список
  on(notificationsClearAction, state => ({
    ...state,
    list: []
  }))
);



// Общее состояние
export const notificationsFeatureSelector = createFeatureSelector<NotificationsState>(NOTIFICATIONS_KEY);

// Список уведомлений
export const notificationsSelector = createSelector(
  notificationsFeatureSelector,
  ({ list }) => list
);

// Количество непрочитанных уведомлений
export const notificationsNoReadCountSelector = createSelector(
  notificationsSelector,
  notifications => notifications.filter(({ status }) => status === NotificationStatus.new).length
);





// Отсортировать массив уведомлений
const sortNotifications = (notifications: Notification[]): Notification[] => notifications
  .sort(({ createDate: a }, { createDate: b }) => AnyToDate(b).getTime() - AnyToDate(a).getTime());

// Добавить/обновить уведомление
const addOrUpdateNotification = (notifications: Notification[], notification: Notification): Notification[] => {
  const notificationIndex: number = notifications.findIndex(({ id }) => id === notification.id);
  // Заменить запись
  if (notificationIndex >= 0) {
    notifications[notificationIndex] = notification;
  }
  // Добавить запись
  else {
    const index: number = findInsertIndex(notifications, notification);
    // Вставить элемент
    notifications.splice(index, 0, notification);
  }
  // Обновленный массив
  return notifications;
};

// Найти индекс куда вставить уведомление
const findInsertIndex = (notifications: Notification[], notification: Notification): number => {
  let low: number = 0;
  let high: number = notifications.length - 1;
  // Поиск нужного индекса
  while (low <= high) {
    const mid: number = Math.floor((low + high) / 2);
    // Увеличить нижний индекс
    if (AnyToDate(notifications[mid].createDate).getTime() > AnyToDate(notification.createDate).getTime()) {
      low = mid + 1;
    }
    // Увеличить верхний индекс
    else {
      high = mid - 1;
    }
  }
  // Вернуть индекс
  return low;
};
