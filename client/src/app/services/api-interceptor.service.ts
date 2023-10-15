import { environment } from "@_environments/environment";
import { GetCurrentUserId } from "@_helpers/account";
import { GetBaseApiUrl } from "@_helpers/app";
import { CustomObject } from "@_models/app";
import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpParams, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";





@Injectable()

export class ApiInterceptorService implements HttpInterceptor {

  private id: number = 0;





  // Замена свойств
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.updateState();
    // Параметры
    let url: string = /^http(s)?/i.test(req.url) || /^(\/)?assets(s)?/i.test(req.url) ? req.url : GetBaseApiUrl() + req.url;
    const paramsData: CustomObject<number> = { "token_user_id": this.id };
    const headers: HttpHeaders = !!environment.httpHeader ?
      Object.entries(environment.httpHeader).reduce((o, [k, v]) => o.set(k, v?.toString() ?? ""), req.headers) :
      req.headers;
    const params: HttpParams = Object.entries(paramsData).reduce((o, [k, v]) => o.set(k, v), req.params);
    const withCredentials: boolean = params.get("withCredentials") === "false" ? false : environment.withCredentials;
    // URL
    url = url.replace(new RegExp("([^https?:\/\/]+)([\/]+)", "gi"), "$1/");
    // Новый запрос
    const apiReq: HttpRequest<any> = req.clone({ url, headers, params, withCredentials });
    // Вернуть измененный запрос
    return next.handle(apiReq);
  }

  // Получить данные из Local Storage
  private updateState(): void {
    this.id = GetCurrentUserId();
  }
}
