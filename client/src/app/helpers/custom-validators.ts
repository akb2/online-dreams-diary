import { AbstractControl, FormControl, ValidationErrors } from "@angular/forms";





export class CustomValidators {


  // Проверка совпадения пароля
  public static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password: FormControl = control.get("password").value;
    const confirmPassword: FormControl = control.get("confirmPassword").value;
    let errors: ValidationErrors | null = control.get("confirmPassword").errors ? control.get("confirmPassword").errors : {};


    if (password !== confirmPassword) {
      errors.noPassswordMatch = true;
    }

    else {
      delete errors.noPassswordMatch;
    }


    let i: number = 0;
    for (let key in errors) {
      i++;
    }
    if (i == 0) {
      errors = null;
    }


    control.get("confirmPassword").setErrors(errors);
    return errors;
  }
}