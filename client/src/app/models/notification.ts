// Модель уведомления
export interface Notification {
  id: number;
  userId: number;
  status: NotificationStatus;
  createDate: Date;
  text: string;
  link: string;
  actionType: NotificationActionType;
  data: Partial<NotificationData>;
}

// Перечисление типа уведомлений
export enum NotificationActionType {
  addToFriend = "add_to_friend",
  sendComment = "send_comment"
};

// Дополнительные данные уведомлений
export interface NotificationData {
  user: number;
}

// Интерфейс входных данных для поиска по уведомлениям
export interface NotificationSearchRequest {
  status: NotificationStatus;
  ids: number[];
  excludeIds: number[];
  skip: number;
  limit: number;
}





// Статусы уведомлений
export enum NotificationStatus {
  any = -1,
  new = 0,
  read = 1
}
