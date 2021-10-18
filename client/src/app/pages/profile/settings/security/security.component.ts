import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnInit } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { BrowserNames, OsNames, SimpleObject } from '@_models/app';
import { TokenInfo } from '@_models/token';
import { AccountService } from '@_services/account.service';
import { SnackbarService } from '@_services/snackbar.service';
import { TokenService } from '@_services/token.service';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';





@Component({
  selector: 'app-settings-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsSecurityComponent implements OnInit, DoCheck {


  tokenInfo: TokenInfo;
  tokensInfo: LoadingTokenInfo[];
  osNames: SimpleObject = OsNames;
  browserNames: SimpleObject = BrowserNames;

  loadingTokenInfo: boolean = true;
  loadingTokensInfo: boolean = true;

  oldUser: User;
  get user(): User {
    return AppComponent.user;
  };





  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private snackbarService: SnackbarService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.getToken();
    this.getTokens();
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }





  // Получить сведения о токене
  private getToken(): void {
    this.loadingTokenInfo = true;
    // Загрузка информации о токене
    this.tokenService.getToken().subscribe(
      tokenInfo => {
        this.loadingTokenInfo = false;
        this.tokenInfo = tokenInfo;
        // Обновить
        this.changeDetectorRef.detectChanges();
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
        // Обновить
        this.changeDetectorRef.detectChanges();
      },
      () => {
        this.loadingTokensInfo = false;
        this.tokensInfo = [];
        // Обновить
        this.changeDetectorRef.detectChanges();
      }
    );
  }

  // Удалить токен
  deleteToken(tokenId: number): void {
    const tokenInfo: LoadingTokenInfo = this.tokensInfo.find(t => t.id === tokenId)
    // Найден объект
    if (tokenInfo) {
      tokenInfo.loading = true;
      // Запрос
      this.tokenService.deleteTokenById(tokenId)
        .pipe(switchMap(d => d ? this.tokenService.getTokens(true, this.tokenService.id, ["0002"]) : of([] as TokenInfo[]), (d, u) => [d, u]))
        .subscribe(
          (response: [boolean, TokenInfo[]]) => {
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
              tokenInfo.loading = false;
              // Сообщение об удалении
              this.snackbarService.open({
                mode: "error",
                message: "Не удалось удалить выбранный токен"
              });
            }
            // Обновить
            this.changeDetectorRef.detectChanges();
          },
          () => tokenInfo.loading = false
        );
    }
  }

  // Удалить все токены
  deleteTokens(): void {
    this.loadingTokensInfo = true;
    // Запрос
    this.tokenService.deleteTokensByUser(true)
      .pipe(switchMap(d => d ? this.tokenService.getTokens(true, this.tokenService.id, ["0002"]) : of([] as TokenInfo[]), (d, u) => [d, u]))
      .subscribe(
        (response: [boolean, TokenInfo[]]) => {
          const [del, tokensInfo] = response;
          this.loadingTokensInfo = false;
          // Токены удалены
          if (del) {
            // Обновить сведения
            this.tokensInfo = tokensInfo.map(tokenInfo => ({ ...tokenInfo, loading: false }));
            // Сообщение об удалении
            this.snackbarService.open({
              mode: "success",
              message: "Все авторизации кроме текущей удалены"
            });
          }
          // Токен не удален
          else {
            this.loadingTokensInfo = false;
            // Сообщение об удалении
            this.snackbarService.open({
              mode: "error",
              message: "Не удалось удалить все авторизации. Обратитесь за помощью в техническую поддержку"
            });
          }
          // Обновить
          this.changeDetectorRef.detectChanges();
        },
        () => this.loadingTokensInfo = false
      );
  }
}





// Интерфейс данных токенов
interface LoadingTokenInfo extends TokenInfo {
  loading: boolean;
}