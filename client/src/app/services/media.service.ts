import { ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { MediaFile, MediaFileDto, MediaFileExtension } from "@_models/media";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, concatMap, map, of, take, takeUntil } from "rxjs";
import { AccountService } from "./account.service";





@Injectable({
  providedIn: "root"
})

export class MediaService implements OnDestroy {


  private destroyed$: Subject<void> = new Subject();





  constructor(
    private accountService: AccountService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
        url: data?.url?.toString()
      }))
    );
  }
}
