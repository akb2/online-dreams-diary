import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { ValidatorData } from '@_models/form';





// Декоратор компонента
@Component({
  selector: 'app-settings-person-profile',
  templateUrl: './settings-person.component.html',
  styleUrls: ['./settings-person.component.scss']
})

// Основной класс
export class SettingsPersonProfileComponent {


  public form: FormGroup;

  public get user(): User {
    return AppComponent.user;
  };

  constructor(
    private formBuilder: FormBuilder
  ) {
    // Настройка формы
    this.form = formBuilder.group([
      new FormControl(["name", ValidatorData.name]),
      new FormControl(["lastName", ValidatorData.name]),
      new FormControl(["patronymic", ValidatorData.name])
    ]);
  }
}
