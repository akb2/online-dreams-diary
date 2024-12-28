import { SafeHtml, SafeUrl } from "@angular/platform-browser";
import { User } from "./account";
import { BaseSearch, SearchResponce } from "./api";
import { Dream } from "./dream";
import { NumberDirection } from "./math";
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
  html: SafeHtml;
  createDate: Date;
  attachment: CommentAttachment;
  uploadAttachment?: CommentUploadAttachment;
}

// Интерфейс прикрепленных данных
export interface CommentAttachment {
  graffity?: MediaFile;
  dreams?: Dream[];
  mediaPhotos?: MediaFile[];
  youTubeVideos?: YouTubeVideo[];
}

// Интерфейс прикрепленных данных для сохранения на сервер
export interface CommentUploadAttachment {
  graffity?: File;
  mediaPhotos?: number[];
  youTubeVideos?: [string, number][];
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

// Интерфейс поиска комментариев: запрос
export interface SearchResponceComment extends SearchResponce<Comment> {
  prevCount: number;
  nextCount: number;
  hasAccess: boolean;
}

// Интерфейс поиска комментариев: ответ
export interface SearchRequestComment extends Pick<BaseSearch, "limit"> {
  materialType: CommentMaterialType;
  materialId: number;
  startWithId: number;
  lastDate: string;
  lastId: number;
  loadListType: NumberDirection;
}

// Сокращенные данные видео YouTube
export interface YouTubeVideoShort {
  id: string;
  startTime?: number;
}

// Видео YouTube
export interface YouTubeVideoBase extends YouTubeVideoShort {
  link: string;
}

// Полные данные YouTube видео
export interface YouTubeVideo extends YouTubeVideoBase {
  smallImage: string;
}



// Типы материалов комментариев
export enum CommentMaterialType {
  Profile,
  Dream,
  Media,
  Photo
}
