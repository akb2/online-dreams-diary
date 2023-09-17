import { ObjectToFormData } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { MediaFile, MediaFileDto, MediaFileExtension } from "@_models/media";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, concatMap, map, of, switchMap, take, takeUntil } from "rxjs";
import { AccountService } from "./account.service";
import { ApiService } from "./api.service";





@Injectable({
  providedIn: "root"
})

export class MediaService implements OnDestroy {

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private accountService: AccountService,
    private httpClient: HttpClient,
    private apiService: ApiService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Загрузить файл
  upload(file: File, codes: string[] = []): Observable<MediaFile | number> {
    return this.httpClient.post<ApiResponse>("media/upload", ObjectToFormData({ file }), { reportProgress: true, observe: "events" }).pipe(
      takeUntil(this.destroyed$),
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
      takeUntil(this.destroyed$),
      map(data => ({ ...data, userId: data?.user?.id ?? data?.userId })),
      concatMap(
        ({ userId }) => userId ? this.accountService.user$(userId) : of(null),
        (data, user) => ({ ...data, user })
      ),
      take(1),
      map(data => ({
        id: ParseInt(data?.id),
        createDate: ToDate(data?.createDate),
        user: data?.user ?? null,
        hash: data?.hash?.toString() ?? "",
        size: ParseInt(data?.size),
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
