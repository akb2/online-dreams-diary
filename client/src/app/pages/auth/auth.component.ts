import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { ErrorMessages, ErrorMessagesType, FormData, FormDataType, ValidatorData } from "@_models/form";
import { AccountService } from "@_services/account.service";





@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"]
})





export class AuthComponent implements OnInit {


  public form: FormGroup;
  public errors: ErrorMessagesType = ErrorMessages;
  public formData: FormDataType = FormData;

  public loginMinLength: number = 4;
  public loginMaxLength: number = 24;
  public passwordMinLength: number = 6;
  public passwordMaxLength: number = 50;

  public loading: boolean = false;





  // Конструктор
  constructor(
    private accountService: AccountService
  ) {
    this.form = new FormGroup({
      login: new FormControl(null, ValidatorData.login),
      password: new FormControl(null, ValidatorData.password)
    });
  }





  // Запуск класса
  public ngOnInit(): void {
  }





  // Попытка авторизации
  public tryLogin(): void {
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
