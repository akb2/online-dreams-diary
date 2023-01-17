import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AccountErrorMessages, AccountValidatorData, FormData } from "@_datas/form";
import { ErrorMessagesType, FormDataType } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { of, Subject, takeUntil, timer } from "rxjs";





@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AuthComponent implements OnDestroy {


  form: FormGroup;
  errors: ErrorMessagesType = AccountErrorMessages;
  formData: FormDataType = FormData;
  navMenuType: NavMenuType = NavMenuType.collapse;

  loginMinLength: number = 4;
  loginMaxLength: number = 24;
  passwordMinLength: number = 6;
  passwordMaxLength: number = 50;

  loading: boolean = false;
  showActivate: boolean = false;
  activateIsAvail: boolean = false;
  endActivation: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private canonicalService: CanonicalService
  ) {
    this.form = this.formBuilder.group({
      login: ["", AccountValidatorData.login],
      password: ["", AccountValidatorData.password],
      captcha: ["", Validators.required]
    });
    this.canonicalService.setURL("auth");
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Отмена активации
  onActivationCancel(): void {
    this.showActivate = false;
    this.endActivation = false;
    this.changeDetectorRef.detectChanges();
  }





  // Попытка авторизации
  tryLogin(): void {
    const loginControl: FormControl = this.form.get("login") as FormControl;
    const passwordControl: FormControl = this.form.get("password") as FormControl;
    // Форма без ошибок
    if (!!loginControl?.valid && !!passwordControl?.valid) {
      const login: string = loginControl.value;
      const password: string = passwordControl.value;
      // Обновить данные
      this.loading = true;
      this.showActivate = false;
      // Авторизация
      this.accountService.auth(login, password, ["9019"])
        .subscribe(
          ({ code, activateIsAvail }) => {
            this.loading = false;
            // Требуется активация аккаунта
            if (code === "9019") {
              this.showActivate = true;
              this.activateIsAvail = activateIsAvail;
            }
            // Обновить
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.loading = false;
            this.showActivate = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
    // Есть ошибки
    else {
      loginControl.markAllAsTouched();
      passwordControl.markAllAsTouched();
    }
  }

  // Отрпавить код активации аккаунта
  sendActivationCode(): void {
    const loginControl: FormControl = this.form.get("login") as FormControl;
    const passwordControl: FormControl = this.form.get("password") as FormControl;
    const captchaControl: FormControl = this.form.get("captcha") as FormControl;
    // Форма без ошибок
    if (!!passwordControl?.valid && !!passwordControl?.valid && !!captchaControl?.valid) {
      const login: string = loginControl.value;
      const password: string = passwordControl.value;
      const captcha: string = captchaControl.value;
      // Обновить данные
      this.loading = true;
      this.changeDetectorRef.detectChanges();
      // Запрос на новый код активации
      this.accountService.createActivationCode(login, password, captcha)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => {
            this.loading = false;
            this.endActivation = true;
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.loading = false;
            captchaControl.setValue(null);
            this.changeDetectorRef.detectChanges();
          }
        );
    }
    // Ошибка в логине и пароле
    else if (!passwordControl?.valid || !passwordControl?.valid) {
      loginControl.markAllAsTouched();
      passwordControl.markAllAsTouched();
      this.showActivate = false;
      this.changeDetectorRef.detectChanges();
    }
    // Заполнить капчу
    else {
      captchaControl.markAllAsTouched();
    }
  }
}
