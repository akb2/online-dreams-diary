import { formatDate } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AppRecaptchaComponent } from "@app/controlers/elements/app-recaptcha/app-recaptcha.component";
import { CustomValidators } from "@app/helpers/custom-validators";
import { UserRegister } from "@app/models/account";
import { AccountService } from "@app/services/account.service";
import { LocalStorageService } from "@app/services/local-storage.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})





export class RegisterComponent implements OnInit, OnDestroy {


  @ViewChild(AppRecaptchaComponent) public appRecaptchaComponent!: AppRecaptchaComponent;

  public form: FormGroup[];
  public errors: FormErrors;

  public step: number = 0;
  private cookieKey: string = "register_form_data_";
  private cookieLifeTime: number = 60 * 30 * 10000000000;
  public loading: boolean = false;
  public registed: boolean = false;
  public registerEmail: string;

  public loginMinLength: number = 4;
  public loginMaxLength: number = 24;
  public passwordMinLength: number = 6;
  public passwordMaxLength: number = 50;
  public emailMinLength: number = 6;
  public emailMaxLength: number = 120;
  public nameMinLength: number = 2;
  public nameMaxLength: number = 30;
  public birthDateMinAge: number = 10;
  public birthDateMaxAge: number = 120;

  private destroyed$: Subject<any> = new Subject();





  // Конструктор
  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private accountService: AccountService
  ) {
    // Кукис
    this.localStorage.cookieKey = this.cookieKey;
    this.localStorage.cookieLifeTime = this.cookieLifeTime;

    // Данные формы
    this.form = [
      // Данные входа
      this.formBuilder.group({
        testLogin: [[], null],
        login: [this.localStorage.getCookie("login"), [
          Validators.required,
          Validators.minLength(this.loginMinLength),
          Validators.maxLength(this.loginMaxLength),
          Validators.pattern(/^([a-z0-9\-_]+)$/i)
        ]],
        password: [this.localStorage.getCookie("password"), [
          Validators.required,
          Validators.minLength(this.passwordMinLength),
          Validators.maxLength(this.passwordMaxLength)
        ]],
        confirmPassword: [this.localStorage.getCookie("confirmPassword"), [
          Validators.required,
          Validators.minLength(this.passwordMinLength),
          Validators.maxLength(this.passwordMaxLength)
        ]]
      }, {
        validators: [
          CustomValidators.passwordMatchValidator,
          CustomValidators.uniqueLoginData
        ]
      }),
      // Сведения
      this.formBuilder.group({
        name: [this.localStorage.getCookie("name"), [
          Validators.required,
          Validators.minLength(this.nameMinLength),
          Validators.maxLength(this.nameMaxLength),
          Validators.pattern(/^([а-я\-]+)$/i)
        ]],
        lastName: [this.localStorage.getCookie("lastName"), [
          Validators.required,
          Validators.minLength(this.nameMinLength),
          Validators.maxLength(this.nameMaxLength),
          Validators.pattern(/^([а-я\-]+)$/i)
        ]],
        birthDate: [this.localStorage.getCookie("birthDate") ? new Date(this.localStorage.getCookie("birthDate")) : null, [
          Validators.required
        ]],
        sex: [
          this.localStorage.getCookie("sex") ? this.localStorage.getCookie("sex") === "true" : false
        ]
      }),
      // Контакты
      this.formBuilder.group({
        testEmail: [[], null],
        email: [this.localStorage.getCookie("email"), [
          Validators.required,
          Validators.email,
          Validators.minLength(this.emailMinLength),
          Validators.maxLength(this.emailMaxLength)
        ]],
        captcha: ["", Validators.required]
      }, {
        validators: [
          CustomValidators.uniqueEmailData
        ]
      })
    ];

    // Ошибки
    this.errors = {
      login: {
        required: "Введите логин",
        minlength: `Минимум ${this.loginMinLength} символа`,
        maxlength: `Максимум ${this.loginMaxLength} символа`,
        pattern: "Допустимы только цифры, латиница, тире и подчеркивание",
        noUniqueLogin: "Такой логин уже используется"
      },
      password: {
        required: "Введите пароль",
        minlength: `Минимум ${this.passwordMinLength} символа`,
        maxlength: `Максимум ${this.passwordMaxLength} символа`
      },
      confirmPassword: {
        required: "Подтвердите пароль",
        noPassswordMatch: "Пароли должны совпадать",
        minlength: `Минимум ${this.passwordMinLength} символа`,
        maxlength: `Максимум ${this.passwordMaxLength} символа`
      },
      email: {
        required: "Введите актуальную почту",
        email: "Введите корректный адрес почты",
        minlength: `Минимум ${this.emailMinLength} символа`,
        maxlength: `Максимум ${this.emailMaxLength} символа`,
        noUniqueEmail: "Эта почта уже используется"
      },
      name: {
        required: "Введите ваше имя",
        minlength: `Минимум ${this.nameMinLength} символа`,
        maxlength: `Максимум ${this.nameMaxLength} символа`,
        pattern: "Допустимы только кириллица и тире"
      },
      lastName: {
        required: "Введите вашу фамилию",
        minlength: `Минимум ${this.nameMinLength} символа`,
        maxlength: `Максимум ${this.nameMaxLength} символа`,
        pattern: "Допустимы только кириллица и тире"
      },
      birthDate: {
        required: `Укажите возраст в пределе ${this.birthDateMinAge} - ${this.birthDateMaxAge} лет`
      },
      captcha: {
        required: `Пройдите капчу`
      }
    };
  }





  // Запуск класса
  public ngOnInit(): void {
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
  public ngOnDestroy(): void {
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
  public onKeySubmit(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      this.nextStep();
    }
  }

  // Ответ от капчи
  public captchaResolved(code: string): void {
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
  public nextStep(): void {
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
  public prevStep(): void {
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
  public ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }
}





// Интерфейс ошибок
interface FormErrors {
  login?: FormErrorsKeys;
  password?: FormErrorsKeys;
  confirmPassword?: FormErrorsKeys;
  email?: FormErrorsKeys;
  phone?: FormErrorsKeys;
  name?: FormErrorsKeys;
  lastName?: FormErrorsKeys;
  birthDate?: FormErrorsKeys;
  captcha?: FormErrorsKeys;
}

// Ключи ошибок
interface FormErrorsKeys {
  required?: string;
  pattern?: string;
  email?: string;
  minlength?: string;
  maxlength?: string;
  noPassswordMatch?: string;
  noUniqueLogin?: string;
  noUniqueEmail?: string;
  agevalidator?: string;
  captcha?: string;
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
