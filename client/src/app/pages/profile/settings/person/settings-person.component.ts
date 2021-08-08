import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { User } from '@_models/account';
import { ErrorMessages, ErrorMessagesType, FormData, FormDataType, ValidatorData } from '@_models/form';
import { AccountService } from '@_services/account.service';





// Декоратор компонента
@Component({
  selector: 'app-settings-person-profile',
  templateUrl: './settings-person.component.html',
  styleUrls: ['./settings-person.component.scss']
})

// Основной класс
export class SettingsPersonProfileComponent {


  public form: FormGroup;
  public errors: ErrorMessagesType = ErrorMessages;
  public formData: FormDataType = FormData;
  public user: User;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder
  ) {
    // Настройка формы
    this.form = this.formBuilder.group({
      name: ["", ValidatorData.name],
      lastName: ["", ValidatorData.name],
      patronymic: ["", ValidatorData.name],
      birthDate: ["", ValidatorData.birthDate],
      sex: [false]
    });
    // Подписка на данные пользвателя
    this.accountService.user$.subscribe(user => {
      this.user = user;
      // Значения формы
      if (this.user) {
        this.form.get("name").setValue(this.user.name);
        this.form.get("lastName").setValue(this.user.lastName);
        this.form.get("patronymic").setValue(this.user.patronymic);
        this.form.get("birthDate").setValue(new Date(this.user.birthDate));
        this.form.get("sex").setValue(this.user.sex == 1 ? true : false);
      }
    });
  }





  // Сохранение данных
  public onSaveData(): void {
  }





  // Возраст до даты
  public ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }
}
