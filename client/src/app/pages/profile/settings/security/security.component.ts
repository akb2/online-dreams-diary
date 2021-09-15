import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@_models/account';
import { BrowserNames, CustomObject, OsNames, SimpleObject } from '@_models/app';
import { TokenInfo } from '@_models/token';
import { AccountService } from '@_services/account.service';
import { SnackbarService } from '@_services/snackbar.service';
import { TokenService } from '@_services/token.service';
import { Observable, of, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';





// Декоратор компонента
@Component({
  selector: 'app-settings-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})

// Основной класс
export class SettingsSecurityComponent implements OnInit, OnDestroy {


  public user: User;
  public tokenInfo: TokenInfo;
  public tokensInfo: LoadingTokenInfo[];
  public osNames: SimpleObject = OsNames;
  public browserNames: SimpleObject = BrowserNames;

  public loadingTokenInfo: boolean = true;
  public loadingTokensInfo: boolean = true;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.getToken();
    this.getTokens();
    // Подписка на данные пользвателя
    this.subscribeUser().subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Получить сведения о токене
  private getToken(): void {
    this.loadingTokenInfo = true;
    // Загрузка информации о токене
    this.tokenService.getToken().subscribe(
      tokenInfo => {
        this.loadingTokenInfo = false;
        this.tokenInfo = tokenInfo;
      },
      () => this.loadingTokenInfo = false
    );
  }

  // Получить сведения о всех токенах
  private getTokens(): void {
    this.loadingTokensInfo = true;
    // Загрузка информации о токене
    this.tokenService.getTokens(true, this.tokenService.id, ["0002"]).subscribe(
      tokensInfo => {
        this.loadingTokensInfo = false;
        this.tokensInfo = tokensInfo.map(tokenInfo => ({ ...tokenInfo, loading: false }));
      },
      () => {
        this.loadingTokensInfo = false;
        this.tokensInfo = [];
      }
    );
  }

  // Удалить токен
  public deleteToken(tokenId: number): void {
    const tokenInfo: LoadingTokenInfo = this.tokensInfo.find(t => t.id === tokenId)
    // Найден объект
    if (tokenInfo) {
      tokenInfo.loading = true;
      // Запрос
      this.tokenService.deleteTokenById(tokenId)
        .pipe(switchMap(d => d ? this.tokenService.getTokens(true) : of([] as TokenInfo[]), (d, u) => [d, u]))
        .subscribe((response: [boolean, TokenInfo[]]) => {
          const [del, tokensInfo] = response;
          // Токен удален
          if (del) {
            const loadings: { id: number, loading: boolean }[] = this.tokensInfo.map(({ id, loading }) => ({ id, loading }));
            // Обновить сведения
            this.tokensInfo = tokensInfo.map(tokenInfo => ({ ...tokenInfo, loading: loadings.find(l => l.id === tokenInfo.id).loading }));
            // Сообщение об удалении
            this.snackbarService.open({
              mode: "success",
              message: "Выбранный токен успешно удален"
            });
          }
          // Токен не удален
          else {
            this.snackbarService.open({
              mode: "error",
              message: "Ytудалось удалить выбранный токен"
            });
          }
        });
    }
  }

  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      map(user => {
        this.user = user;
        // Вернуть юзера
        return user;
      })
    );
  }
}





// Интерфейс данных токенов
interface LoadingTokenInfo extends TokenInfo {
  loading: boolean;
}