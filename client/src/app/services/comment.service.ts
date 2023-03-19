import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { ApiResponse } from "@_models/api";
import { Comment, CommentAttachment, CommentMaterialType } from "@_models/comment";
import { concatMap, forkJoin, map, Observable, of, Subject, switchMap, take, takeUntil } from "rxjs";
import { AccountService } from "./account.service";
import { ApiService } from "./api.service";





@Injectable({
  providedIn: "root"
})

export class CommentService implements OnDestroy {


  private destroyed$: Subject<void> = new Subject();





  // Конвертация комментария
  private getConvertedComment(comment: any): Observable<Comment> {
    const userId: number = ParseInt(comment?.userId);
    const replyToUserId: number = ParseInt(comment?.replyToUserId);
    let attachment: CommentAttachment = {};
    const getUser = (id: number) => !!id ? this.accountService.user$(userId).pipe(take(1)) : of(null);
    // Закрепления
    try {
      attachment = JSON.parse(comment?.attachment);
    }
    // Ошибка преобразования
    catch (e: any) { }
    // Вернуть подписчика
    return of({ comment }).pipe(
      takeUntil(this.destroyed$),
      concatMap(() => getUser(userId), (data, user) => ({ ...data, user })),
      concatMap(() => getUser(replyToUserId), (data, replyToUser) => ({ ...data, replyToUser })),
      map(({ comment, user, replyToUser }) => ({
        id: ParseInt(comment?.id),
        user,
        replyToUser,
        materialType: ParseInt(comment?.materialType) as CommentMaterialType,
        materialId: ParseInt(comment?.materialId),
        text: comment?.text ?? "",
        createDate: ToDate(comment?.createDate),
        attachment
      }))
    );
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private accountService: AccountService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Отправка комментария
  send(materialType: CommentMaterialType, materialId: number, text: string, codes: string[] = []): Observable<any> {
    return this.httpClient.post<ApiResponse>("comment/send", ObjectToFormData({ materialType, materialId, text })).pipe(
      takeUntil(this.destroyed$),
      switchMap(data => this.apiService.checkSwitchMap(data, codes))
    );
  }

  // Получение списка комментариев
  getList(materialType: CommentMaterialType, materialId: number, skip: number = 0, codes: string[] = []): Observable<any> {
    const params: HttpParams = ObjectToParams({ materialType, materialId, skip }, "search_");
    // Вернуть подписчик
    return this.httpClient.get<ApiResponse>("comment/getList", { params }).pipe(
      takeUntil(this.destroyed$),
      switchMap(data => this.apiService.checkSwitchMap(data, codes)),
      concatMap(
        ({ result: { data } }) => forkJoin((data?.comments ?? []).map(comment => this.getConvertedComment(comment))),
        ({ result: { data } }, result) => ({
          count: ParseInt(data?.count),
          limit: ParseInt(data?.limit),
          result
        })
      )
    );
  }
}
