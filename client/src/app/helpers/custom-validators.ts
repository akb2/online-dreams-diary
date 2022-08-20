import { AbstractControl, ValidationErrors } from "@angular/forms";





export class CustomValidators {

  // Проверка совпадения пароля
  // * noPassswordMatch
  static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password: string = control.get("password").value;
    const confirmPassword: string = control.get("confirmPassword").value;
    let errors: ValidationErrors | null = control.get("confirmPassword").errors ? control.get("confirmPassword").errors : {};

    // Выставить ошибку
    if (password !== confirmPassword) {
      errors.noPassswordMatch = true;
    }
    // Удалить ошибку
    else {
      delete errors.noPassswordMatch;
    }

    // Проверка ошибок
    let i: number = 0;
    for (let key in errors) {
      i++;
    }
    // Ошибок нет
    if (i == 0) {
      errors = null;
    }

    // Установить ошибки
    control.get("confirmPassword").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка уникального логина или пароля
  // * noUniqueLogin
  static uniqueLoginData(control: AbstractControl): ValidationErrors | null {
    const login: string = control.get("login").value || "";
    const testLogin: string[] = control.get("testLogin").value || [];
    let errors: ValidationErrors | null = control.get("login").errors ? control.get("login").errors : {};

    // Найдены похожие логины
    if (login && testLogin.some(value => value === login)) {
      errors.noUniqueLogin = true;
    }
    // Совпадений нет
    else {
      delete errors.noUniqueLogin;
    }

    // Проверка ошибок
    let i: number = 0;
    for (let key in errors) {
      i++;
    }
    // Ошибок нет
    if (i == 0) {
      errors = null;
    }

    // Установить ошибки
    control.get("login").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка уникального логина или пароля
  // * noUniqueEmail
  static uniqueEmailData(control: AbstractControl): ValidationErrors | null {
    const email: string = control.get("email").value || "";
    const testEmail: string[] = control.get("testEmail").value || [];
    let errors: ValidationErrors | null = control.get("email").errors ? control.get("email").errors : {};

    // Найдены похожие адреса почты
    if (email && testEmail.some(value => value === email)) {
      errors.noUniqueEmail = true;
    }
    // Совпадений нет
    else {
      delete errors.noUniqueEmail;
    }

    // Проверка ошибок
    let i: number = 0;
    for (let key in errors) {
      i++;
    }
    // Ошибок нет
    if (i == 0) {
      errors = null;
    }

    // Установить ошибки
    control.get("email").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка правильности ввода пароля
  // * wrongPassword
  static currentPasswordCheck(control: AbstractControl): ValidationErrors | null {
    const currentPassword: string = control.get("currentPassword").value || "";
    const testPasswords: string[] = control.get("testPasswords").value || [];
    let errors: ValidationErrors | null = control.get("currentPassword").errors ? control.get("currentPassword").errors : {};

    // Найдены похожие пароли
    if (currentPassword && testPasswords.some(value => value === currentPassword)) {
      errors.wrongPassword = true;
    }
    // Совпадений нет
    else {
      delete errors.wrongPassword;
    }

    // Ошибок нет
    errors = Object.keys(errors).length > 0 ? errors : null;

    // Установить ошибки
    control.get("currentPassword").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка нового пароля, чтобы не совпадал с текущим
  // * newPasswordIsMatchWithOld
  static newPasswordMatchWithOld(control: AbstractControl): ValidationErrors | null {
    const currentPassword: string = control.get("currentPassword").value || "";
    const password: string = control.get("password").value || "";
    let errors: ValidationErrors | null = control.get("password").errors ? control.get("password").errors : {};

    // Новый пароль повторяет старый
    if (currentPassword && password && currentPassword === password) {
      errors.newPasswordIsMatchWithOld = true;
    }
    // Совпадений нет
    else {
      delete errors.newPasswordIsMatchWithOld;
    }

    // Ошибок нет
    errors = Object.keys(errors).length > 0 ? errors : null;

    // Установить ошибки
    control.get("password").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }
}
