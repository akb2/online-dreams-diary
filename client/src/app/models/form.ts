import { IconBackground, IconColor } from "@_models/app";
import { CustomObject } from "@akb2/types-tools";
import { AbstractControlOptions, ValidatorFn } from "@angular/forms";





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

// Тип данных для выпадающего списка
export interface OptionData {
  key: string;
  title: string;
  subTitle?: string;
  image?: string;
  icon?: string;
  iconColor?: IconColor;
  iconBackground?: IconBackground;
  imagePosition?: AutocompleteImageSize;
  data?: any;
}

// Интерфейс параметров слайдера
export interface SliderSettings {
  min: number;
  max: number;
  step: number;
  icon?: string;
}





// Значения для данных
export type FormDataType = CustomObject<number>;

// Тип для валидаторов ошибок
export type ValidatorDataType = CustomObject<ValidatorFn | ValidatorFn[] | AbstractControlOptions>;

// Тип для текстов ошибок
export type ErrorMessagesType = CustomObject<FormErrorsKeys>;

// Допустимые типы полей
export type AutocompleteType = "autocomplete" | "select";

// Допустимые значения позиции картинки
export type AutocompleteImageSize = "cover" | "contain";
