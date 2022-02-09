import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { AccountErrorMessages, ErrorMessagesType, FormData, FormDataType, AccountValidatorData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";





@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"]
})

export class AuthComponent implements OnInit {


  form: FormGroup;
  errors: ErrorMessagesType = AccountErrorMessages;
  formData: FormDataType = FormData;
  navMenuType: NavMenuType = NavMenuType.collapse;

  loginMinLength: number = 4;
  loginMaxLength: number = 24;
  passwordMinLength: number = 6;
  passwordMaxLength: number = 50;

  loading: boolean = false;





  // Конструктор
  constructor(
    private accountService: AccountService
  ) {
    this.form = new FormGroup({
      login: new FormControl(null, AccountValidatorData.login),
      password: new FormControl(null, AccountValidatorData.password)
    });
  }





  // Запуск класса
  ngOnInit(): void {
  }





  // Попытка авторизации
  tryLogin(): void {
    // Форма без ошибок
    if (this.form.valid) {
      const login: string = this.form.get("login").value;
      const password: string = this.form.get("password").value;
      this.loading = true;
      // Авторизация
      this.accountService.auth(login, password).subscribe(
        code => {
          this.loading = false;
          // Успешная авторизация
          if (code == "0001") {
          }
        },
        () => this.loading = false
      );
    }

    // Есть ошибки
    else {
      this.form.markAllAsTouched();
    }
  }
}
