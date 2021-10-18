import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { MenuItem } from '@_models/menu';





@Component({
  selector: 'app-settings-profile',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsProfileComponent {


  imagePrefix: string = "../../../../assets/images/backgrounds/";

  menuItems: MenuItem[];

  get user(): User {
    return AppComponent.user;
  };

  constructor() {
    // Настройки пунктов меню
    this.menuItems = [{
      icon: "assignment_ind",
      text: "Персональные данные",
      desc: "Настройки всех личных персональных данных вашего аккаунта",
      link: "person"
    }, {
      icon: "color_lens",
      text: "Персонализация",
      desc: "Настройка внешнего вида приложения",
      link: "appearance"
    }, {
      icon: "security",
      text: "Безопасность аккаунта",
      desc: "Просмотр всех активных сессий, изменение пароля",
      link: "security"
    }];
  }
}
