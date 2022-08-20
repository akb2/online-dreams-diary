import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { AppComponent } from "@app/app.component";
import { CustomValidators } from "@_helpers/custom-validators";
import { User } from "@_models/account";
import { BrowserNames, OsNames, SimpleObject } from "@_models/app";
import { AccountErrorMessages, AccountValidatorData, ErrorMessagesType, FormData, FormDataType } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { TokenInfo } from "@_models/token";
import { SnackbarService } from "@_services/snackbar.service";
import { TokenService } from "@_services/token.service";
import { of } from "rxjs";
import { switchMap } from "rxjs/operators";





@Component({
  selector: "app-profile-settings-security",
  templateUrl: "./profile-settings-security.component.html",
  styleUrls: ["./profile-settings-security.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsSecurityComponent implements OnInit, DoCheck {


  tokenInfo: TokenInfo;
  tokensInfo: LoadingTokenInfo[];
  osNames: SimpleObject = OsNames;
  browserNames: SimpleObject = BrowserNames;
  navMenuType: NavMenuType = NavMenuType.collapse;

  formData: FormDataType = FormData;
  passForm: FormGroup;
  passErrors: ErrorMessagesType = AccountErrorMessages;

  loadingTokenInfo: boolean = true;
  loadingTokensInfo: boolean = true;
  loadingChangePassword: boolean = true;

  oldUser: User;





  // Сведения о текущем пользователе
  get user(): User {
    return AppComponent.user;
  };





  constructor(
    private tokenService: TokenService,
    private snackbarService: SnackbarService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.passForm = this.formBuilder.group({
      testPasswords: [[]],
      currentPassword: ["", AccountValidatorData.password],
      password: ["", AccountValidatorData.password],
      confirmPassword: ["", AccountValidatorData.password]
    }, {
      validators: [
        CustomValidators.currentPasswordCheck
      ]
    });
  }

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
          (response) => {
            const [del, tokensInfo] = response as [boolean, TokenInfo[]];
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
        (response) => {
          const [del, tokensInfo] = response as [boolean, TokenInfo[]];
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
