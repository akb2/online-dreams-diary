import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpParams, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@_environments/environment";
import { SimpleObject } from "@_models/app";
import { LocalStorageService } from "@_services/local-storage.service";
import { Observable } from "rxjs";





@Injectable()

export class ApiInterceptorService implements HttpInterceptor {


  private cookieKey: string = "token_service_";
  private cookieLifeTime: number = 604800;

  private id: string = "";





  constructor(
    private localStorageService: LocalStorageService
  ) { }





  // Замена свойств
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.updateState();
    // Параметры
    let url: string = /^http(s)?/i.test(req.url) || /^(\/)?assets(s)?/i.test(req.url) ? req.url : environment.baseApiUrl + req.url;
    const paramsData: SimpleObject = { "token_user_id": this.id };
    const headers: HttpHeaders = !!environment.httpHeader ?
      Object.entries(environment.httpHeader).reduce((o, [k, v]) => o.set(k, v?.toString() ?? ""), req.headers) :
      req.headers;
    const params: HttpParams = Object.entries(paramsData).reduce((o, [k, v]) => o.set(k, v), req.params);
    const withCredentials: boolean = params.get("withCredentials") === "false" ? false : true;
    // URL
    url = url.replace(new RegExp("([^https?:\/\/]+)([\/]+)", "gi"), "$1/");
    // Новый запрос
    const apiReq: HttpRequest<any> = req.clone({ url, headers, params, withCredentials });
    // Вернуть измененный запрос
    return next.handle(apiReq);
  }

  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Получить данные из Local Storage
  private updateState(): void {
    this.configLocalStorage();
    this.id = this.localStorageService.getCookie("current_user");
  }
}
