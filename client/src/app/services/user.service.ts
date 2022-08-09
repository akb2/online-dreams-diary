import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@_environments/environment";
import { User } from "@_models/account";
import { ApiResponse, Search } from "@_models/api";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { TokenService } from "@_services/token.service";
import { map, mergeMap, Observable, of, switchMap, tap } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class UserService {


  private baseUrl: string = environment.baseUrl;





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private accountService: AccountService,
    private tokenService: TokenService
  ) { }





  // Поиск пользоватлей
  search(search: SearchUser, codes: string[] = []): Observable<Search<User>> {
    const url: string = this.baseUrl + "account/search";
    let count: number = 0;
    let limit: number = 0;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.tokenService.getHttpHeader(search, "search_")).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(testCode => testCode === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      tap(r => {
        count = r.count ?? 0;
        limit = r.limit ?? 0;
      }),
      mergeMap(r => of(!!r?.people?.length ? r.people.map(u => this.accountService.userConverter(u)) : [])),
      mergeMap((result: User[]) => of({ count, result, limit }))
    );
  }
}





// Поиск: входящие данные
export interface SearchUser {
  page?: number;
}
