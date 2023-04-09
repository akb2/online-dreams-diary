import { ObjectToFormData, ObjectToParams, UrlParamsStringToObject } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { ApiResponse } from "@_models/api";
import { Comment, CommentAttachment, CommentMaterialType } from "@_models/comment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Observable, Subject, catchError, concatMap, filter, forkJoin, map, of, share, switchMap, take, takeUntil, tap, timer } from "rxjs";
import { AccountService } from "./account.service";
import { ApiService } from "./api.service";
import { MediaService } from "./media.service";





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
      attachment = (typeof comment?.attachment === "string" ? JSON.parse(comment?.attachment) : comment?.attachment) ?? {};
    }
    // Ошибка преобразования
    catch (e: any) { }
    // Вернуть подписчика
    return of({ comment }).pipe(
      takeUntil(this.destroyed$),
      concatMap(() => getUser(userId), (data, user) => ({ ...data, user })),
      concatMap(() => getUser(replyToUserId), (data, replyToUser) => ({ ...data, replyToUser })),
      concatMap(
        () => !!attachment?.graffity ? this.mediaService.convertData(attachment.graffity) : of(null),
        (data, graffity) => ({ ...data, attachment: { ...attachment, graffity } })
      ),
      map(({ comment, user, replyToUser }) => ({
        id: ParseInt(comment?.id),
        user,
        replyToUser,
        materialType: ParseInt(comment?.materialType) as CommentMaterialType,
        materialId: ParseInt(comment?.materialId),
        materialOwner: ParseInt(comment?.materialOwner),
        text: comment?.text ?? "",
        createDate: ToDate(comment?.createDate),
        attachment
      }))
    );
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private accountService: AccountService,
    private mediaService: MediaService
  ) { }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Отправка комментария
  send(data: Partial<Comment>, codes: string[] = []): Observable<any> {
    return this.httpClient.post<ApiResponse>("comment/send", ObjectToFormData({
      materialType: data.materialType,
      materialId: data.materialId,
      materialOwner: data.materialOwner,
      text: data.text,
      graffityUpload: data?.uploadAttachment?.graffity
    })).pipe(
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
        ({ result: { data } }) => !!data?.comments?.length ? forkJoin((data?.comments ?? []).map(comment => this.getConvertedComment(comment))) : of([]),
        ({ result: { data } }, result) => ({
          count: ParseInt(data?.count),
          limit: ParseInt(data?.limit),
          result
        })
      )
    );
  }

  // Получение комментария по ID
  getById(id: number, codes: string[] = []): Observable<Comment> {
    const params: HttpParams = ObjectToParams({ comment_id: id });
    // Вернуть подписчик
    return this.httpClient.get<ApiResponse>("comment/getById", { params }).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      concatMap(comment => this.getConvertedComment(comment))
    );
  }

  // Ожидания новых комментариев
  waitNewComment(materialType: CommentMaterialType, materialId: number, codes: string[] = []): Observable<Comment> {
    let connect: boolean = false;
    // Вернуть подписку
    return timer(0, 1000).pipe(
      share(),
      takeUntil(this.destroyed$),
      filter(() => !connect),
      concatMap(() => this.httpClient.get("longPolling/get/comment/" + materialType + "/" + materialId).pipe(catchError(e => of({ ...e, text: "" })))),
      catchError(() => of({ text: "" })),
      map(r => ParseInt(UrlParamsStringToObject(r?.text ?? "")?.commentId)),
      concatMap(commentId => commentId > 0 ? this.getById(commentId, codes).pipe(catchError(() => of(null))) : of(null)),
      tap(() => connect = false)
    );
  }
}
