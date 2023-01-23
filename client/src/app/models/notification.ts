// Модель уведомления
export interface Notification {
  id: number;
  userId: number;
  status: NotificationStatus;
  createDate: Date;
  text: string;
  link: string;
  actionType: string;
  data: Partial<NotificationData>;
}

// Дополнительные данные уведомлений
export interface NotificationData {
  user: number;
}

// Интерфейс входных данных для поиска по уведомлениям
export interface NotificationSearchRequest {
  status: NotificationStatus;
  lastId: number;
  limit: number;
}





// Статусы уведомлений
export enum NotificationStatus {
  any = -1,
  new = 0,
  read = 1
}
