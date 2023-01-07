// Интерфейс заявки в друзья
export interface Friend {
  id: number;
  outUserId: number;
  inUserId: number;
  status: FriendStatus;
  outDate: Date;
  inDate: Date;
}

// Состояние заявки в друзья
export enum FriendStatus {
  NotAutorized = -2,
  NotExists = -1,
  Friends = 1,
  OutSubscribe = 0,
  InSubscribe = 2,
}
