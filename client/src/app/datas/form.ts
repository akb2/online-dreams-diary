import { Validators } from "@angular/forms";
import { ErrorMessagesType, FormDataType, ValidatorDataType } from "@_models/form";





// Значения для данных
export const FormData: FormDataType = {
  // Для аккаунтов
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
  birthDateProjectYear: 2022,
  // Для сновидений
  dreamTitleMinLength: 3,
  dreamTitleMaxLength: 60,
  dreamDescriptionMaxLength: 400,
};

// Список месяцев
export const MonthPlural: string[] = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

// Валидаторы для аккаунтов
export const AccountValidatorData: ValidatorDataType = {
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

// Валидаторы сновидений
export const DreamValidatorData: ValidatorDataType = {
  // Заголовок
  title: [
    Validators.required,
    Validators.minLength(FormData.dreamTitleMinLength),
    Validators.maxLength(FormData.dreamTitleMaxLength),
    Validators.pattern(/^([^`~\^\+\=\[\]\{\}\\\/\<\>]+)$/i)
  ],
  // Описание
  description: [
    Validators.maxLength(FormData.dreamDescriptionMaxLength)
  ]
};

// Тексты ошибок для аккаунтов
export const AccountErrorMessages: ErrorMessagesType = {
  login: {
    required: "Введите логин",
    minlength: `Минимум ${FormData.loginMinLength} символа`,
    maxlength: `Максимум ${FormData.loginMaxLength} символа`,
    pattern: "Допустимы только цифры, латиница, тире и подчеркивание",
    noUniqueLogin: "Такой логин уже используется"
  },
  password: {
    required: "Введите пароль",
    newPasswordIsMatchWithOld: "Новый пароль не должен повторять текущий",
    minlength: `Минимум ${FormData.passwordMinLength} символа`,
    maxlength: `Максимум ${FormData.passwordMaxLength} символа`
  },
  confirmPassword: {
    required: "Подтвердите пароль",
    noPassswordMatch: "Пароли должны совпадать",
    minlength: `Минимум ${FormData.passwordMinLength} символа`,
    maxlength: `Максимум ${FormData.passwordMaxLength} символа`
  },
  currentPassword: {
    required: "Введите текущий проль",
    wrongPassword: "Неверный пароль",
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
  patronymic: {
    required: "Введите ваше отчество",
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

// Тексты ошибок для сновидений
export const DreamErrorMessages: ErrorMessagesType = {
  // Заголовок
  title: {
    required: "Введите заголовок",
    minlength: `Минимум ${FormData.dreamTitleMinLength} символа`,
    maxlength: `Максимум ${FormData.dreamTitleMaxLength} символа`,
    pattern: "Запрещено: `, ~, ^, +, =, [, ], {, }, \\, /, <, >"
  },
  // Описание
  description: {
    maxlength: `Максимум ${FormData.dreamDescriptionMaxLength} символа`
  }
};
