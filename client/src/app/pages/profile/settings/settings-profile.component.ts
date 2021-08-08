import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { MenuItem } from '@_models/menu';





// Декоратор компонента
@Component({
  selector: 'app-home',
  templateUrl: './settings-profile.component.html',
  styleUrls: ['./settings-profile.component.scss']
})

// Основной класс
export class SettingsProfileComponent {


  public menuItems: MenuItem[];

  public get user(): User {
    return AppComponent.user;
  };

  constructor() {
    // Настройки пунктов меню
    this.menuItems = [{
      auth: 1,
      icon: "assignment_ind",
      text: "Персональные данные",
      desc: "Настройки всех личных персональных данных вашего аккаунта",
      link: "person"
    }, {
      auth: 1,
      icon: "security",
      text: "Безопасность аккаунта",
      desc: "Просмотр всех активных сессий, изменение пароля",
      link: "security"
    }];
  }
}
