import { AbstractControl, ValidationErrors } from "@angular/forms";





export class CustomValidators {

  // Проверка совпадения пароля
  // * noPassswordMatch
  static passwordMatchValidator(control: AbstractControl): ValidationErrors {
    const password: string = control.get("password").value;
    const confirmPassword: string = control.get("confirmPassword").value;
    const errors: ValidationErrors = CustomValidators.checkErrorObject({
      ...control?.get("confirmPassword")?.errors ?? {},
      noPassswordMatch: password !== confirmPassword
    });
    // Установить ошибки
    control.get("confirmPassword").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка уникального логина или пароля
  // * noUniqueLogin
  static uniqueLoginData(control: AbstractControl): ValidationErrors {
    const login: string = control.get("login").value || "";
    const testLogin: string[] = control.get("testLogin").value || [];
    const errors: ValidationErrors = CustomValidators.checkErrorObject({
      ...control?.get("login")?.errors ?? {},
      noUniqueLogin: login && testLogin.includes(login)
    });
    // Установить ошибки
    control.get("login").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка уникального логина или пароля
  // * noUniqueEmail
  static uniqueEmailData(control: AbstractControl): ValidationErrors {
    const email: string = control.get("email").value || "";
    const testEmail: string[] = control.get("testEmail").value || [];
    const errors: ValidationErrors = CustomValidators.checkErrorObject({
      ...control?.get("email")?.errors ?? {},
      noUniqueEmail: email && testEmail.includes(email)
    });
    // Установить ошибки
    control.get("email").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка правильности ввода пароля
  // * wrongPassword
  static currentPasswordCheck(control: AbstractControl): ValidationErrors {
    const currentPassword: string = control.get("currentPassword").value || "";
    const testPasswords: string[] = control.get("testPasswords").value || [];
    const errors: ValidationErrors = CustomValidators.checkErrorObject({
      ...control?.get("currentPassword")?.errors ?? {},
      wrongPassword: currentPassword && testPasswords.includes(currentPassword)
    });
    // Установить ошибки
    control.get("currentPassword").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }

  // Проверка нового пароля, чтобы не совпадал с текущим
  // * newPasswordIsMatchWithOld
  static newPasswordMatchWithOld(control: AbstractControl): ValidationErrors {
    const currentPassword: string = control.get("currentPassword").value || "";
    const password: string = control.get("password").value || "";
    const errors: ValidationErrors = CustomValidators.checkErrorObject({
      ...control?.get("password")?.errors ?? {},
      newPasswordIsMatchWithOld: currentPassword && password && currentPassword === password
    });
    // Установить ошибки
    control.get("password").setErrors(errors);
    // Вернуть ошибки
    return errors;
  }





  // Обработка массива ошибок
  private static checkErrorObject(errors: ValidationErrors): ValidationErrors {
    errors = Object.entries(errors)
      .filter(([, v]) => !!v)
      .reduce((o, [k]) => ({ ...o, [k]: true }), {});
    // Нет ошибок
    return !!Object.keys(errors).length ? errors : null;
  }
}
