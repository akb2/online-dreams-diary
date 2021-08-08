import { Validators } from "@angular/forms";
import { CustomValidators } from "@_helpers/custom-validators";

// Ключи ошибок
export interface FormErrorsKeys {
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

// Значения для данных
export const FormData: { [key: string]: number } = {
  loginMinLength: 4,
  loginMaxLength: 24,
  passwordMinLength: 6,
  passwordMaxLength: 50,
  emailMinLength: 6,
  emailMaxLength: 120,
  nameMinLength: 2,
  nameMaxLength: 30,
  birthDateMinAge: 10,
  birthDateMaxAge: 120,
};

// Валидаторы
export const ValidatorData: { [key: string]: (Validators | CustomValidators)[] } = {
  // Логин
  login: [
    Validators.required,
    Validators.minLength(FormData.loginMinLength),
    Validators.maxLength(FormData.loginMaxLength),
    Validators.pattern(/^([a-z0-9\-_]+)$/i)
  ],
  // Пароль
  password: [
    Validators.required,
    Validators.minLength(FormData.passwordMinLength),
    Validators.maxLength(FormData.passwordMaxLength)
  ],
  // Для имени, фамилии и отчества
  name: [
    Validators.required,
    Validators.minLength(FormData.nameMinLength),
    Validators.maxLength(FormData.nameMaxLength),
    Validators.pattern(/^([а-я\-]+)$/i)
  ],
  // Для даты рождения
  birthDate: [
    Validators.required
  ],
  // Почта
  email: [
    Validators.required,
    Validators.email,
    Validators.minLength(FormData.emailMinLength),
    Validators.maxLength(FormData.emailMaxLength)
  ]
}

// Тексты ошибок
export const ErrorMessages: { [key: string]: FormErrorsKeys } = {
  login: {
    required: "Введите логин",
    minlength: `Минимум ${FormData.loginMinLength} символа`,
    maxlength: `Максимум ${FormData.loginMaxLength} символа`,
    pattern: "Допустимы только цифры, латиница, тире и подчеркивание",
    noUniqueLogin: "Такой логин уже используется"
  },
  password: {
    required: "Введите пароль",
    minlength: `Минимум ${FormData.passwordMinLength} символа`,
    maxlength: `Максимум ${FormData.passwordMaxLength} символа`
  },
  confirmPassword: {
    required: "Подтвердите пароль",
    noPassswordMatch: "Пароли должны совпадать",
    minlength: `Минимум ${FormData.passwordMinLength} символа`,
    maxlength: `Максимум ${FormData.passwordMaxLength} символа`
  },
  email: {
    required: "Введите актуальную почту",
    email: "Введите корректный адрес почты",
    minlength: `Минимум ${FormData.emailMinLength} символа`,
    maxlength: `Максимум ${FormData.emailMaxLength} символа`,
    noUniqueEmail: "Эта почта уже используется"
  },
  name: {
    required: "Введите ваше имя",
    minlength: `Минимум ${FormData.nameMinLength} символа`,
    maxlength: `Максимум ${FormData.nameMaxLength} символа`,
    pattern: "Допустимы только кириллица и тире"
  },
  lastName: {
    required: "Введите вашу фамилию",
    minlength: `Минимум ${FormData.nameMinLength} символа`,
    maxlength: `Максимум ${FormData.nameMaxLength} символа`,
    pattern: "Допустимы только кириллица и тире"
  },
  birthDate: {
    required: `Укажите возраст в пределе ${FormData.birthDateMinAge} - ${FormData.birthDateMaxAge} лет`
  },
  captcha: {
    required: `Пройдите капчу`
  }
};