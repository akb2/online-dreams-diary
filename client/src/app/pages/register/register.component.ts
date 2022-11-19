import { formatDate } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AppRecaptchaComponent } from "@app/controlers/elements/app-recaptcha/app-recaptcha.component";
import { CustomValidators } from "@app/helpers/custom-validators";
import { UserRegister } from "@app/models/account";
import { AccountService } from "@app/services/account.service";
import { LocalStorageService } from "@app/services/local-storage.service";
import { AccountErrorMessages, AccountValidatorData, ErrorMessagesType, FormData, FormDataType } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
  providers: [
    LocalStorageService
  ]
})

export class RegisterComponent implements OnInit, OnDestroy {


  @ViewChild(AppRecaptchaComponent) appRecaptchaComponent!: AppRecaptchaComponent;

  form: FormGroup[];
  errors: ErrorMessagesType = AccountErrorMessages;
  formData: FormDataType = FormData;
  navMenuType: NavMenuType = NavMenuType.collapse;

  step: number = 0;
  private cookieKey: string = "register_form_data_";
  private cookieLifeTime: number = 60 * 30 * 10000000000;
  loading: boolean = false;
  registed: boolean = false;
  registerEmail: string;

  private destroyed$: Subject<any> = new Subject();





  // Конструктор
  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private accountService: AccountService
  ) {
    this.localStorage.cookieKey = this.cookieKey;
    this.localStorage.cookieLifeTime = this.cookieLifeTime;

    // Данные формы
    this.form = [
      // Данные входа
      this.formBuilder.group({
        testLogin: [[], null],
        login: [this.localStorage.getCookie("login"), AccountValidatorData.login],
        password: [this.localStorage.getCookie("password"), AccountValidatorData.password],
        confirmPassword: [this.localStorage.getCookie("confirmPassword"), AccountValidatorData.password]
      }, {
        validators: [
          CustomValidators.passwordMatchValidator,
          CustomValidators.uniqueLoginData
        ]
      }),
      // Сведения
      this.formBuilder.group({
        name: [this.localStorage.getCookie("name"), AccountValidatorData.name],
        lastName: [this.localStorage.getCookie("lastName"), AccountValidatorData.name],
        birthDate: [this.localStorage.getCookie("birthDate") ? new Date(this.localStorage.getCookie("birthDate")) : null, AccountValidatorData.birthDate],
        sex: [this.localStorage.getCookie("sex") ? this.localStorage.getCookie("sex") === "true" : false]
      }),
      // Контакты
      this.formBuilder.group({
        testEmail: [[], null],
        email: [this.localStorage.getCookie("email"), AccountValidatorData.email],
        captcha: ["", Validators.required]
      }, {
        validators: [
          CustomValidators.uniqueEmailData
        ]
      })
    ];
  }





  // Запуск класса
  ngOnInit(): void {
    // Переключить на нужную форму, если есть заполненные данные
    let skipForm: boolean = false;
    this.form.map((group, key) => {
      if (!skipForm) {
        this.step = key;
        if (!group.valid) {
          skipForm = true;
        }
      }
    });

    // Изменение формы
    this.form.map(group => group.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(data => this.onChange(data)));
  }

  // Завершение класса
  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  // Изменение формы
  private onChange(datas: CookieFormDatas): void {
    Object.entries(datas).map(data => {
      // Преобразовать дату
      if (data[0] === "birthDate") {
        data[1] = data[1] ? (typeof data[1] === "string" ? data[1] : data[1].toString()) : "";
      }
      // Преобразовать булев
      else if (data[0] === "sex") {
        data[1] = data[1] ? "true" : "false";
      }

      this.localStorage.setCookie(data[0], typeof data[1] === "string" ? data[1] : "");
    });
  }

  // Нажатие Enter в форме
  onKeySubmit(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      this.nextStep();
    }
  }

  // Ответ от капчи
  captchaResolved(code: string): void {
    // * Secret key
    // * 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
    code = code ? code : "";

    this.form[2].get("captcha").setValue(code);
    this.form[2].updateValueAndValidity();
  }





  // Попытка регистрации
  private tryRegister(): void {
    // Форма без ошибок
    if (this.form.every(group => group.valid)) {
      const birthDate: Date = new Date(this.form[1].get("birthDate").value);
      this.loading = true;
      // Данные для регистрации пользователя
      const userRegister: UserRegister = {
        login: this.form[0].get("login").value,
        password: this.form[0].get("password").value,
        name: this.form[1].get("name").value,
        lastName: this.form[1].get("lastName").value,
        birthDate: formatDate(birthDate, "yyyy-MM-dd", "en-US"),
        sex: !!this.form[1].get("sex").value ? 1 : 0,
        email: this.form[2].get("email").value,
        captcha: this.form[2].get("captcha").value
      };
      // Регистрация
      this.accountService.register(userRegister, ["9010", "9011", "9012"]).subscribe(
        code => {
          this.loading = false;
          this.form[2].get("captcha").setValue(null);
          // Успешная регистрация
          if (code == "0001") {
            this.registed = true;
            this.registerEmail = userRegister.email;
            // Удалить данные из кэша
            this.form.forEach(form => Object.entries(form.controls).forEach(([key]) => this.localStorage.deleteCookie(key)));
          }
          // Ошибка капчи
          else if (code == "9010") {
            this.form[2].get("captcha").setValue(null);
            this.setStep(2);
          }
          // Ошибка логина
          else if (code == "9011") {
            const testLogin: string[] = this.form[0].get("testLogin").value;
            if (testLogin.every(login => login !== userRegister.login)) {
              testLogin.push(userRegister.login);
              this.setStep(0);
            }
          }
          // Ошибка почты
          else if (code == "9012") {
            const testEmail: string[] = this.form[2].get("testEmail").value;
            if (testEmail.every(email => email !== userRegister.email)) {
              testEmail.push(userRegister.email);
              this.setStep(2);
            }
          }
        },
        () => {
          this.loading = false;
          this.form[2].get("captcha").setValue(null);
        }
      );
    }

    // Есть ошибки
    else {
      this.form.every((group, index) => {
        if (!group.valid) {
          this.step = index;
          group.markAllAsTouched();
        }
      });
    }
  }

  // Следущий шаг
  nextStep(): void {
    // Следующая форма
    if (this.step < this.form.length - 1 && this.form[this.step].valid) {
      this.step++;
      // Если есть капча
      if (this.step == 2) {
        setTimeout(() => this.appRecaptchaComponent.calculateWidth());
      }
    }
    // Отправка формы
    else if (this.step === this.form.length - 1 && this.form[this.step].valid) {
      this.tryRegister();
    }
    // Отобразить ошибки
    else {
      this.form[this.step].markAllAsTouched();
    }
  }

  // Следущий шаг
  prevStep(): void {
    // Предыдущая форма
    if (this.step > 0) {
      this.step--;
    }
  }

  // Установить конкретный шаг
  private setStep(step: number): void {
    const maxStep: number = Math.min(step, this.form.length - 1);
    for (let iStep = 0; iStep <= maxStep; iStep++) {
      // Проверяем валидны ли предыдущие шаги
      if (this.form[iStep].valid) {
        if (iStep == maxStep) {
          this.step = maxStep;
          this.form[this.step].markAllAsTouched();
        }
      }
      // Находим первую ошибку
      else {
        this.step = iStep;
        this.form[this.step].markAllAsTouched();
      }
    }
  }

  // Возраст до даты
  ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }
}





// Данные формы
interface CookieFormDatas {
  login?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  name?: string;
  lastName?: string;
  birthDate?: string;
}
