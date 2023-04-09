import { SafeUrl } from "@angular/platform-browser";
import { User } from "./account";
import { MediaFile } from "./media";





// Интерфейс комментария
export interface Comment {
  id: number;
  user: User;
  replyToUser: User;
  materialType: CommentMaterialType;
  materialId: number;
  materialOwner: number;
  text: string;
  createDate: Date;
  attachment: CommentAttachment;
  uploadAttachment?: CommentUploadAttachment;
}

// Интерфейс прикрепленных данных
export interface CommentAttachment {
  graffity?: MediaFile;
}

// Интерфейс прикрепленных данных для сохранения на сервер
export interface CommentUploadAttachment {
  graffity?: File;
}

// Интерфейс данных рисовалки
export interface GraffityDrawData {
  size?: number;
  color?: string;
  image?: string | SafeUrl;
  blob?: Blob;
  version: string;
  objects: Object[];
  background?: string;
}





// Типы материалов комментариев
export enum CommentMaterialType {
  Profile,
  Dream
}
