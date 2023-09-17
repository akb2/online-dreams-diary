import { User } from "./account";





// Данные медиа файла
export interface MediaFile {
  id: number;
  createDate: Date;
  userId?: number;
  user: User;
  hash: string;
  size: number;
  extension: MediaFileExtension;
  originalName: string;
  keywords: string[];
  description: string;
  url: string;
  urlLarge: string;
  urlMiddle: string;
  urlSmall: string;
}

// Данные получаемые с сервера
export interface MediaFileDto {
  id: number;
  createDate: string;
  userId: number;
  user?: User;
  hash: string;
  size: number;
  extension: string;
  originalName: string;
  keywords: string[];
  description: string;
  url: string;
  urlLarge: string;
  urlMiddle: string;
  urlSmall: string;
}





// Расширения медиафайлов
export enum MediaFileExtension {
  jpg = "jpg",
  jpeg = "jpeg",
  png = "png",
  gif = "gif"
}
