import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { ApiResponse } from "@_models/api";
import { CommentMaterialType } from "@_models/comment";
import { Observable, Subject, switchMap, takeUntil } from "rxjs";
import { ApiService } from "./api.service";





@Injectable({
  providedIn: "root"
})

export class CommentService implements OnDestroy {
  private destroyed$: Subject<void> = new Subject();





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService
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
  getList(materialType: CommentMaterialType, materialId: number, codes: string[] = []): Observable<any> {
    return this.httpClient.get<ApiResponse>("comment/getList", { params: ObjectToParams({ materialType, materialId }) }).pipe(
      takeUntil(this.destroyed$),
      switchMap(data => this.apiService.checkSwitchMap(data, codes))
    );
  }
}
