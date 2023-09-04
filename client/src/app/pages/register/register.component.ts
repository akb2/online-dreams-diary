import { AccountErrorMessages, AccountValidatorData, FormData } from "@_datas/form";
import { environment } from "@_environments/environment";
import { ErrorMessagesType, FormDataType } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { CanonicalService } from "@_services/canonical.service";
import { formatDate } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AppRecaptchaComponent } from "@app/controlers/elements/app-recaptcha/app-recaptcha.component";
import { CustomValidators } from "@app/helpers/custom-validators";
import { UserRegister, UserSex } from "@app/models/account";
import { AccountService } from "@app/services/account.service";
import { LocalStorageService } from "@app/services/local-storage.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  sexes: typeof UserSex = UserSex;

  reCaptchaKey: string = environment.reCaptchaKey;

  private destroyed$: Subject<void> = new Subject();





  // Возраст до даты
  ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }





  constructor(
    private formBuilder: FormBuilder,
    private localStorageService: LocalStorageService,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private canonicalService: CanonicalService
  ) {
    this.localStorageService.itemKey = this.cookieKey;
    this.localStorageService.itemLifeTime = this.cookieLifeTime;
    // Данные формы контактных данных
    const formContactDatas: any = {
      testEmail: [[], null],
      email: [this.localStorageService.getItem("email"), AccountValidatorData.email],
    };
    // Данные формы
    this.form = [
      // Данные входа
      this.formBuilder.group(
        // Данные
        {
          testLogin: [[], null],
          login: [this.localStorageService.getItem("login"), AccountValidatorData.login],
          password: [this.localStorageService.getItem("password"), AccountValidatorData.password],
          confirmPassword: [this.localStorageService.getItem("confirmPassword"), AccountValidatorData.password]
        },
        // Валидаторы
        {
          validators: [
            CustomValidators.passwordMatchValidator,
            CustomValidators.uniqueLoginData
          ]
        }
      ),
      // Сведения
      this.formBuilder.group(
        // Данные
        {
          name: [this.localStorageService.getItem("name"), AccountValidatorData.name],
          lastName: [this.localStorageService.getItem("lastName"), AccountValidatorData.name],
          birthDate: [
            this.localStorageService.getItem("birthDate") ?
              new Date(this.localStorageService.getItem("birthDate")) :
              null, AccountValidatorData.birthDate
          ],
          sex: [!!this.localStorageService.getItem("sex") ? UserSex.Female : UserSex.Male]
        }
      ),
      // Контакты
      this.formBuilder.group(
        // Данные
        !!this.reCaptchaKey ? { ...formContactDatas, captcha: ["", Validators.required] } : formContactDatas,
        // Валидаторы
        {
          validators: [
            CustomValidators.uniqueEmailData
          ]
        }
      )
    ];
    this.canonicalService.setURL("register");
  }

  ngOnInit(): void {
    let skipForm: boolean = false;
    // Переключить на нужную форму, если есть заполненные данные
    this.form.map((group, key) => {
      if (!skipForm) {
        this.step = key;
        // Остановиться на форме, если есть незаполненные поля
        if (!group.valid) {
          skipForm = true;
        }
      }
    });
    // Изменение формы
    this.form.map(group => group.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(data => this.onChange(data)));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Изменение формы
  private onChange(datas: LocalStorageFormDatas): void {
    Object.entries(datas).map(data => {
      if (data[0] === "birthDate") {
        data[1] = data[1] ? (typeof data[1] === "string" ? data[1] : data[1].toString()) : "";
      }
      // Преобразовать булев
      else if (data[0] === "sex") {
        data[1] = data[1] ? "true" : "false";
      }
      // Сохранить значение
      this.localStorageService.setItem(data[0], typeof data[1] === "string" ? data[1] : "");
    });
  }

  // Нажатие Enter в форме
  onKeySubmit(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      this.nextStep();
    }
  }





  // Попытка регистрации
  private tryRegister(): void {
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
        captcha: this.form[2]?.get("captcha")?.value ?? "",
        checkCaptcha: !!this.reCaptchaKey
      };
      // Регистрация
      this.accountService.register(userRegister, ["9010", "9011", "9012"])
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          code => {
            this.loading = false;
            this.form[2].get("captcha")?.setValue(null);
            // Успешная регистрация
            if (code == "0001") {
              this.registed = true;
              this.registerEmail = userRegister.email;
              // Удалить данные из кэша
              this.form.forEach(form => Object.entries(form.controls).forEach(([key]) => this.localStorageService.deleteItem(key)));
            }
            // Ошибка капчи
            else if (code == "9010") {
              this.setStep(2);
            }
            // Ошибка логина
            else if (code == "9011") {
              const testLogin: string[] = this.form[0].get("testLogin").value;
              // Добавить логин в список как невалидный
              if (testLogin.every(login => login !== userRegister.login)) {
                testLogin.push(userRegister.login);
                this.setStep(0);
              }
            }
            // Ошибка почты
            else if (code == "9012") {
              const testEmail: string[] = this.form[2].get("testEmail").value;
              // Добавить почту в список как невалидную
              if (testEmail.every(email => email !== userRegister.email)) {
                testEmail.push(userRegister.email);
                this.setStep(2);
              }
            }
            // Обновить
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.loading = false;
            this.form[2].get("captcha")?.setValue(null);
          }
        );
    }
    // Есть ошибки
    else {
      this.form.every((group, index) => {
        if (!group.valid) {
          this.step = index;
          group.markAllAsTouched();
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  // Следущий шаг
  nextStep(): void {
    // Следующая форма
    if (this.step < this.form.length - 1 && this.form[this.step].valid) {
      this.step++;
      this.changeDetectorRef.detectChanges();
    }
    // Отправка формы
    else if (this.step === this.form.length - 1 && this.form[this.step].valid) {
      this.tryRegister();
    }
    // Отобразить ошибки
    else {
      this.form[this.step].markAllAsTouched();
      this.changeDetectorRef.detectChanges();
    }
  }

  // Следущий шаг
  prevStep(): void {
    // Предыдущая форма
    if (this.step > 0) {
      this.step--;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Установить конкретный шаг
  private setStep(step: number): void {
    const maxStep: number = Math.min(step, this.form.length - 1);
    // Цикл по шагам
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
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }
}





// Данные формы
interface LocalStorageFormDatas {
  login?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  name?: string;
  lastName?: string;
  birthDate?: string;
}
