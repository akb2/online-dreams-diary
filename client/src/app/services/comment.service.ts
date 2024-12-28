import { ObjectToFormData, ObjectToParams, UrlParamsStringToObject } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { GetYouTubeImage, GetYouTubeLink } from "@_helpers/comment";
import { ParseInt } from "@_helpers/math";
import { AnyToArray, ArrayMap, UniqueArray } from "@_helpers/objects";
import { AnyToString, GetDreamIdByUrl, GetLinksFromString, IsDreamUrl } from "@_helpers/string";
import { TextMessage } from "@_helpers/text-message";
import { ApiResponse } from "@_models/api";
import { Comment, CommentAttachment, CommentMaterialType, SearchRequestComment, SearchResponceComment, YouTubeVideo } from "@_models/comment";
import { SearchRequestDream } from "@_models/dream";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, Optional, Self } from "@angular/core";
import { NgControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { Observable, Subject, catchError, concatMap, defer, forkJoin, map, of, repeat, retry, switchMap, take } from "rxjs";
import { AccountService } from "./account.service";
import { ApiService } from "./api.service";
import { DreamService } from "./dream.service";
import { MediaService } from "./media.service";





@Injectable({
  providedIn: "root"
})

export class CommentService extends TextMessage {


  private destroyed$: Subject<void> = new Subject();





  // Конвертация комментария
  private getConvertedComment(comment: any): Observable<Comment> {
    const userId: number = ParseInt(comment?.userId);
    const replyToUserId: number = ParseInt(comment?.replyToUserId);
    let attachment: CommentAttachment = {};
    const getUser = (id: number) => !!id
      ? this.accountService.user$(id).pipe(take(1))
      : of(null);
    const getDreams = (ids: number[]) => !!ids?.length
      ? this.dreamService.search({ ids, limit: ids.length, checkPrivate: true }, ["0002"])
      : of(null);
    // Закрепления
    try {
      attachment = (typeof comment?.attachment === "string"
        ? JSON.parse(comment?.attachment)
        : comment?.attachment
      ) ?? {};
    }
    // Ошибка преобразования
    catch (e: any) { }
    // Вернуть подписчика
    return of({ comment }).pipe(
      switchMap(
        () => getUser(userId),
        (data, user) => ({ ...data, user })
      ),
      switchMap(
        () => getUser(replyToUserId),
        (data, replyToUser) => ({ ...data, replyToUser })
      ),
      switchMap(
        data => {
          const text: string = (data?.comment?.text ?? "").replace(new RegExp("\\[br\\]", "ig"), " <br> ");
          const dreamIds: number[] = UniqueArray(GetLinksFromString(text)
            .filter(url => IsDreamUrl(url))
            .map(url => GetDreamIdByUrl(url))
            .filter(id => id > 0)
          );
          // Вернуть подписчик
          return dreamIds.length > 0
            ? getDreams(dreamIds)
            : of({} as SearchRequestDream);
        },
        (data, dreams) => ({ ...data, dreams: dreams?.result ?? [] })
      ),
      switchMap(
        () => !!attachment?.graffity
          ? this.mediaService.convertData(attachment.graffity)
          : of(null),
        (data, graffity) => ({ ...data, graffity })
      ),
      switchMap(
        () => !!attachment?.mediaPhotos?.length
          ? forkJoin(ArrayMap(
            attachment.mediaPhotos,
            id => this.mediaService.convertData(id),
            false
          ))
          : of([]),
        (data, mediaPhotos) => ({ ...data, mediaPhotos })
      ),
      map(
        data => ({
          ...data,
          youTubeVideos: ArrayMap(
            AnyToArray(attachment?.youTubeVideos),
            data => {
              const id = AnyToString(data?.[0]);
              // Данные видео
              return {
                id,
                startTime: ParseInt(data?.[1]),
                smallImage: GetYouTubeImage(id, "default"),
                middleImage: GetYouTubeImage(id, "hqdefault"),
                link: GetYouTubeLink(id)
              } as YouTubeVideo;
            },
            false
          )
        })
      ),
      map(({ comment, user, replyToUser, graffity, dreams, mediaPhotos, youTubeVideos }) => ({
        id: ParseInt(comment?.id),
        user,
        replyToUser,
        materialType: ParseInt(comment?.materialType) as CommentMaterialType,
        materialId: ParseInt(comment?.materialId),
        materialOwner: ParseInt(comment?.materialOwner),
        text: comment?.text ?? "",
        html: this.textTransform(comment?.text ?? ""),
        createDate: ToDate(comment?.createDate),
        attachment: { graffity, dreams, mediaPhotos, youTubeVideos }
      }))
    );
  }





  constructor(
    @Optional() @Self() controlDir: NgControl,
    private httpClient: HttpClient,
    private apiService: ApiService,
    private accountService: AccountService,
    private mediaService: MediaService,
    private dreamService: DreamService,
    emojiService: EmojiService,
    domSanitizer: DomSanitizer
  ) {
    super(controlDir, emojiService, domSanitizer);
  }





  // Отправка комментария
  send(data: Partial<Comment>, codes: string[] = []): Observable<any> {
    return this.httpClient.post<ApiResponse>("comment/send", ObjectToFormData({
      materialType: data.materialType,
      materialId: data.materialId,
      materialOwner: data.materialOwner,
      replyToUserId: ParseInt(data?.replyToUser?.id),
      text: data.text,
      graffityUpload: data?.uploadAttachment?.graffity,
      attachment: JSON.stringify({
        youTubeVideos: data?.uploadAttachment?.youTubeVideos ?? [],
        mediaPhotos: data?.uploadAttachment?.mediaPhotos ?? []
      })
    })).pipe(
      switchMap(data => this.apiService.checkSwitchMap(data, codes))
    );
  }

  // Получение списка комментариев
  getList(search: Partial<SearchRequestComment>, codes: string[] = []): Observable<SearchResponceComment> {
    const params: HttpParams = ObjectToParams(search, "search_");
    // Вернуть подписчик
    return this.httpClient.get<ApiResponse>("comment/getList", { params }).pipe(
      switchMap(data => this.apiService.checkSwitchMap(data, codes)),
      switchMap(
        ({ result: { data } }) => !!data?.comments?.length ?
          forkJoin<Comment[]>((data?.comments ?? []).map(comment => this.getConvertedComment(comment))) :
          of([] as Comment[]),
        ({ result: { data } }, result) => ({
          count: ParseInt(data?.count),
          limit: ParseInt(data?.limit),
          prevCount: ParseInt(data?.prevCount),
          nextCount: ParseInt(data?.nextCount),
          result,
          hasAccess: !!data?.hasAccess
        })
      )
    );
  }

  // Получение комментария по ID
  getById(id: number, codes: string[] = []): Observable<Comment> {
    const params: HttpParams = ObjectToParams({ comment_id: id });
    // Вернуть подписчик
    return this.httpClient.get<ApiResponse>("comment/getById", { params }).pipe(
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      concatMap(comment => this.getConvertedComment(comment))
    );
  }

  // Удаление комментария
  delete(commentId: number, codes: string[] = []) {
    return this.httpClient.post<ApiResponse>("comment/delete", ObjectToFormData({ commentId })).pipe(
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString())
        ? of(result.result.code === "0001")
        : this.apiService.checkResponse(result.result.code, codes)
      ),
    );
  }

  // Ожидания новых комментариев
  waitNewComment(materialType: CommentMaterialType, materialId: number, codes: string[] = []): Observable<Comment> {
    const url = "longPolling/get/comment/" + materialType + "/" + materialId;
    const request = this.httpClient.get(url, { responseType: "text" }).pipe(
      catchError(e => of({ ...e, text: "" })),
      map(result => ParseInt(UrlParamsStringToObject(result ?? "")?.commentId)),
      switchMap(commentId => commentId > 0
        ? this.getById(commentId, codes).pipe(catchError(() => of(null)))
        : of(null)
      )
    );

    return defer(() => request).pipe(
      repeat(),
      retry(),
    );
  }
}
