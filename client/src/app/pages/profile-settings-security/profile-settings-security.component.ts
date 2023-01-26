import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { BrowserNames, OsNames } from "@_datas/app";
import { AccountErrorMessages, AccountValidatorData, FormData } from "@_datas/form";
import { CustomValidators } from "@_helpers/custom-validators";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { ErrorMessagesType, FormDataType } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { TokenInfo } from "@_models/token";
import { AccountService } from "@_services/account.service";
import { SnackbarService } from "@_services/snackbar.service";
import { TokenService } from "@_services/token.service";
import { of, Subject } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";





@Component({
  selector: "app-profile-settings-security",
  templateUrl: "./profile-settings-security.component.html",
  styleUrls: ["./profile-settings-security.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsSecurityComponent implements OnInit, OnDestroy {


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

  user: User;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private tokenService: TokenService,
    private accountService: AccountService,
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
        CustomValidators.currentPasswordCheck,
        CustomValidators.passwordMatchValidator,
        CustomValidators.newPasswordMatchWithOld
      ]
    });
  }

  ngOnInit() {
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        // Сведения о токенах
        this.getToken();
        this.getTokens();
      });
  }

  ngOnDestroy(): void {
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
        // Обновить
        this.changeDetectorRef.detectChanges();
      },
      () => {
        this.loadingTokenInfo = false;
        // Обновить
        this.changeDetectorRef.detectChanges();
      }
    );
  }

  // Получить сведения о всех токенах
  private getTokens(): void {
    this.loadingTokensInfo = true;
    // Загрузка информации о токене
    this.tokenService.getTokens(true, ["0002"]).subscribe(
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
  onDeleteToken(tokenId: number): void {
    const tokenInfo: LoadingTokenInfo = this.tokensInfo.find(t => t.id === tokenId)
    // Найден объект
    if (tokenInfo) {
      tokenInfo.loading = true;
      // Запрос
      this.tokenService.deleteTokenById(tokenId)
        .pipe(switchMap(d => d ? this.tokenService.getTokens(true, ["0002"]) : of([] as TokenInfo[]), (d, u) => [d, u]))
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
  onDeleteTokens(): void {
    this.loadingTokensInfo = true;
    // Запрос
    this.tokenService.deleteTokensByUser(true)
      .pipe(switchMap(d => d ? this.tokenService.getTokens(true, ["0002"]) : of([] as TokenInfo[]), (d, u) => [d, u]))
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

  // Сменить пароль
  onChangePassword(): void {
    // Если форма валидна
    if (this.passForm.valid) {
      const currentPassword: string = this.passForm.get("currentPassword")?.value?.toString() ?? "";
      const password: string = this.passForm.get("password")?.value?.toString() ?? "";
      let testPasswords: string[] = this.passForm.get("testPasswords").value ?? [];
      // Проверка
      this.accountService.changePassword(currentPassword, password, ["0002"]).subscribe(code => {
        // Пароль изменен
        if (code === "0001") {
          testPasswords = testPasswords.filter(p => p !== password);
          const fields: FormControl[] = [
            this.passForm.get("currentPassword") as FormControl,
            this.passForm.get("password") as FormControl,
            this.passForm.get("confirmPassword") as FormControl
          ];
          // Обновить данные формы
          fields.forEach(f => {
            f.reset();
            f.markAsPristine();
            f.markAsUntouched();
          });
          // Уведомление
          this.snackbarService.open({
            mode: "success",
            message: "Ваш пароль был успешно изменен"
          });
        }
        // Пароль не изменен
        else if (code === "0002") {
          testPasswords.push(currentPassword);
          this.passForm.markAllAsTouched();
        }
        // Обновить форму
        this.passForm.get("testPasswords").setValue(testPasswords);
        this.passForm.updateValueAndValidity();
        this.changeDetectorRef.detectChanges();
      });
    }
    // Есть ошибки
    else {
      this.passForm.markAllAsTouched();
    }
  }
}





// Интерфейс данных токенов
interface LoadingTokenInfo extends TokenInfo {
  loading: boolean;
}
