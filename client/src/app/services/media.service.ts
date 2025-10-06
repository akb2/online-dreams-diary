import { ObjectToFormData } from "@_datas/api";
import { AnyToDate } from "@_datas/app";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { MediaFile, MediaFileDto, MediaFileExtension } from "@_models/media";
import { anyToInt } from "@akb2/types-tools";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, concatMap, map, of, switchMap, take } from "rxjs";
import { AccountService } from "./account.service";
import { ApiService } from "./api.service";



@Injectable({
  providedIn: "root"
})
export class MediaService {
  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService
  ) { }



  // Загрузить файл
  upload(file: File, codes: string[] = []): Observable<MediaFile | number> {
    return this.httpClient.post<ApiResponse>("media/upload", ObjectToFormData({ file }), { reportProgress: true, observe: "events" }).pipe(
      switchMap(event => {
        if (event.type === HttpEventType.UploadProgress && !!event.total) {
          of(Math.round(100 * event.loaded / event.total));
        }
        // Загрузка завершена
        else if (event.type === HttpEventType.Response) {
          const code: ApiResponseCodes = event?.body?.result?.code?.toString();
          // Проверить код ответа
          if (code === "0001" || codes.some(testCode => testCode === code)) {
            return this.convertData(event?.body?.result?.data);
          }
          // Ошибка
          return this.apiService.checkResponse(code, codes);
        }
        // Нулевой прогресс
        return of(0);
      })
    );
  }



  // Конвертировать медиаданные
  convertData(data: MediaFileDto | MediaFile): Observable<MediaFile> {
    return of(data).pipe(
      map(data => ({ ...data, userId: data?.user?.id ?? data?.userId })),
      concatMap(
        ({ userId }) => userId ? this.accountService.user$(userId) : of(null),
        (data, user) => ({ ...data, user })
      ),
      take(1),
      map(data => ({
        id: anyToInt(data?.id),
        createDate: AnyToDate(data?.createDate),
        user: data?.user ?? null,
        hash: data?.hash?.toString() ?? "",
        size: anyToInt(data?.size),
        extension: data?.extension?.toString() as MediaFileExtension,
        originalName: data?.originalName?.toString(),
        keywords: (data?.keywords ?? []).map(keyword => keyword.trim()),
        description: data?.description?.toString(),
        url: data?.url?.toString(),
        urlLarge: data?.urlLarge?.toString(),
        urlMiddle: data?.urlMiddle?.toString(),
        urlSmall: data?.urlSmall?.toString()
      }))
    );
  }
}
