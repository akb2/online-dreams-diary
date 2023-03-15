import { User } from "./account";





// Интерфейс комментария
export interface Comment {
  id: number;
  user: User;
  replyToUser: User;
  materialType: CommentMaterialType;
  materialId: number;
  text: string;
  createDate: Date;
  attachment: CommentAttachment;
}

// Интерфейс прикрепленных данных
export interface CommentAttachment {
}





// Типы материалов комментариев
export enum CommentMaterialType {
  Profile,
  Dream
}
