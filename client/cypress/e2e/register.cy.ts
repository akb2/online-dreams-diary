import { elmExists, elmNotExists, getElm } from "cypress/models/form";
import { Random } from "cypress/models/math";





describe("Регистрация", () => {
  const password: string = "password-" + Random(100000000, 999999999);
  const birthDate: string = Random(1, 28) + "-" + Random(1, 12) + "-" + Random(1950, 2004);





  // Открыть сайт
  const openForm = () => {
    cy.visit("http://localhost:4200");
    // Переход к регистрации
    getElm("main-menu-item-register").click({ force: true });
  };

  // Заполнить первый шаг формы
  const fillStep1 = (login: string) => {
    getElm("register-form-login-field").type(login);
    getElm("register-form-password-field").type(password);
    getElm("register-form-password-confirm-field").type(password);
    getElm("register-form-step-1-next-button").click();
  };

  // Заполнить второй шаг формы
  const fillStep2 = (name: string, lastName: string, sex: boolean) => {
    getElm("register-form-name-field").type(name);
    getElm("register-form-lastName-field").type(lastName);
    getElm("register-form-birthDate-field").type(birthDate);
    getElm("register-form-sex-" + (sex ? "female" : "male") + "-field").click();
    getElm("register-form-step-2-next-button").click();
  };

  // Заполнить второй шаг формы
  const fillStep3 = (email: string) => {
    getElm("register-form-email-field").type(email);
  };

  // Попытка регистрации
  const tryRegister = (mustSuccess: boolean) => {
    getElm("register-form-register-button").click();
    cy.intercept("POST", "https://api-test.dreams-diary.ru/account/register").as("postRequest");
    // Должна быть успешная регистрация
    if (mustSuccess) {
      elmExists("register-form-success-block");
    }
    // Должна быть неуспешная регистрация
    else {
      elmNotExists("register-form-success-block");
    }
  }





  it("Регистрация: мужчина", () => {
    const login: string = "user-test-" + Random(100000000, 999999999);
    // Заполнение форм
    openForm();
    fillStep1(login);
    fillStep2("Андрей", "Кобелев", false);
    fillStep3(login + "@ya.ru");
    tryRegister(true);
  });

  it("Регистрация: женщина", () => {
    const login: string = "user-test-" + Random(100000000, 999999999);
    // Заполнение форм
    openForm();
    fillStep1(login);
    fillStep2("Мария", "Гнездилова", true);
    fillStep3(login + "@ya.ru");
    tryRegister(true);
  });

  it("Регистрация: существующий логин", () => {
    const login: string = "user-test-" + Random(100000000, 999999999);
    // Заполнение форм
    openForm();
    fillStep1("akb2");
    fillStep2("Андрей", "Существующелогинов", true);
    fillStep3(login + "@ya.ru");
    tryRegister(false);
  });

  it("Регистрация: существующая почта", () => {
    const login: string = "user-test-" + Random(100000000, 999999999);
    // Заполнение форм
    openForm();
    fillStep1(login);
    fillStep2("Андрей", "Существующепочтов", true);
    fillStep3("akb2-online@ya.ru");
    tryRegister(false);
  });
})
