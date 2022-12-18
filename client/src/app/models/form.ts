import { AbstractControlOptions, ValidatorFn } from "@angular/forms";
import { CustomObject } from "@_models/app";





// Интерфейс ошибок работы с пользователями
export interface FormErrors {
  login?: FormErrorsKeys;
  password?: FormErrorsKeys;
  confirmPassword?: FormErrorsKeys;
  email?: FormErrorsKeys;
  phone?: FormErrorsKeys;
  name?: FormErrorsKeys;
  lastName?: FormErrorsKeys;
  patronymic?: FormErrorsKeys;
  birthDate?: FormErrorsKeys;
  captcha?: FormErrorsKeys;
}

// Ключи ошибок
export interface FormErrorsKeys {
  required?: string;
  pattern?: string;
  email?: string;
  minlength?: string;
  maxlength?: string;
  noPassswordMatch?: string;
  newPasswordIsMatchWithOld?: string;
  wrongPassword?: string;
  noUniqueLogin?: string;
  noUniqueEmail?: string;
  agevalidator?: string;
  captcha?: string;
}

// Значения для данных
export type FormDataType = CustomObject<number>;

// Тип для валидаторов ошибок
export type ValidatorDataType = CustomObject<ValidatorFn | ValidatorFn[] | AbstractControlOptions>;

// Тип для текстов ошибок
export type ErrorMessagesType = CustomObject<FormErrorsKeys>;
