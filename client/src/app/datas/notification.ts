import { LocalStorageDefaultTtl } from "@_helpers/local-storage";
import { NotificationActionType, NotificationTypeDescription } from "@_models/notification";





// Ключ в локал сторадже
export const NOTIFICATIONS_LOCAL_STORAGE_KEY = "notifications";
export const NOTIFICATIONS_LOCAL_STORAGE_TTL: number = LocalStorageDefaultTtl;





// Список имен типов уведомлений
export const NotificationTypeDescriptions: NotificationTypeDescription[] = [
  // Безопасность
  {
    title: "Безопасность",
    subTitle: "Уведомления о входе, смене пароля и прочих важных настройках аккаунта",
    type: NotificationActionType.security,
    siteRequired: true,
    emailRequired: true
  },
  // Заявки в друзья
  {
    title: "Друзья",
    subTitle: "Уведомления о заявках в друзья",
    type: NotificationActionType.addToFriend,
    siteRequired: true,
    emailRequired: false
  },
  // Комментарии
  {
    title: "Комментарии",
    subTitle: "Уведомления о новых комментариях под моими материалами или стене",
    type: NotificationActionType.sendComment,
    siteRequired: true,
    emailRequired: false
  }
];
