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
  security = "security",
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

// Описание типа уведомления
export interface NotificationTypeDescription {
  type: NotificationActionType;
  title: string;
  subTitle: string;
  siteRequired: boolean;
  emailRequired: boolean;
}





// Статусы уведомлений
export enum NotificationStatus {
  any = -1,
  new = 0,
  read = 1
}
