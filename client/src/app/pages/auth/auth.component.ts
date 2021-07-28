import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";





@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"]
})





export class AuthComponent implements OnInit {


  public form: FormGroup;
  public errors: FormErrors;

  public loginMinLength: number = 4;
  public loginMaxLength: number = 24;
  public passwordMinLength: number = 6;
  public passwordMaxLength: number = 50;





  // Конструктор
  constructor() {
    this.form = new FormGroup({
      login: new FormControl(null, [
        Validators.required,
        Validators.minLength(this.loginMinLength),
        Validators.maxLength(this.loginMaxLength),
        Validators.pattern(/^([a-z0-9\-_]+)$/i)
      ]),
      password: new FormControl(null, [
        Validators.required,
        Validators.minLength(this.passwordMinLength),
        Validators.maxLength(this.passwordMaxLength)
      ])
    });

    this.errors = {
      login: {
        required: "Введите логин",
        minlength: `Минимум ${this.loginMinLength} символа`,
        maxlength: `Максимум ${this.loginMaxLength} символа`,
        pattern: "Допустимы только цифры, латиница, тире и подчеркивание"
      },
      password: {
        required: "Введите пароль",
        minlength: `Минимум ${this.passwordMinLength} символа`,
        maxlength: `Максимум ${this.passwordMaxLength} символа`
      }
    };
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
    }

    // Есть ошибки
    else {
      this.form.markAllAsTouched();
    }
  }
}





// Интерфейс ошибок
interface FormErrors {
  login?: { [key: string]: string };
  password?: { [key: string]: string };
}
