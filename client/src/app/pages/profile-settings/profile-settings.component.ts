import { ChangeDetectorRef, Component, DoCheck } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { MenuItem } from '@_models/menu';





@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})

export class ProfileSettingsComponent implements DoCheck {


  imagePrefix: string = "../../../../assets/images/backgrounds/";

  menuItems: MenuItem[];

  oldUser: User;
  get user(): User {
    return AppComponent.user;
  };





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) {
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

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }
}
