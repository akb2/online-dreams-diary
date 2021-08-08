import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';





// Декоратор компонента
@Component({
  selector: 'app-settings-person-profile',
  templateUrl: './settings-person.component.html',
  styleUrls: ['./settings-person.component.scss']
})

// Основной класс
export class SettingsPersonProfileComponent {
  public get user(): User {
    return AppComponent.user;
  };
}
