import { formatDate } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { User, UserSave } from '@_models/account';
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
  public avatar: FormControl;
  public errors: ErrorMessagesType = ErrorMessages;
  public formData: FormDataType = FormData;
  public user: User;
  public loading: boolean;

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
      sex: [false],
      email: ["", ValidatorData.email],
      avatar: null
    });
    this.avatar = this.formBuilder.control(null);
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
        this.form.get("email").setValue(this.user.email);
        this.avatar.setValue(this.user.avatars.full);
      }
    });
  }





  // Сохранение данных
  public onSaveData(): void {
    // Форма без ошибок
    if (this.form.valid) {
      this.loading = true;
      // Данные для регистрации пользователя
      const userSave: UserSave = {
        name: this.form.get("name").value,
        lastName: this.form.get("lastName").value,
        patronymic: this.form.get("patronymic").value,
        birthDate: formatDate(this.form.get("birthDate").value, "yyyy-MM-dd", "en-US"),
        sex: !!this.form.get("sex").value ? 1 : 0,
        email: this.form.get("email").value,
      };
      // Сохранение данных
      this.accountService.saveUserData(userSave).subscribe(
        code => {
          this.loading = false;
          // Успешная регистрация
          if (code == "0001") {
            alert("Данные сохранены");
          }
        },
        () => this.loading = false
      );
    }
    // Есть ошибки
    else {
      this.form.markAllAsTouched();
    }
  }

  // Загрузка аватарки
  public onUploadAvatar(file: File): void {
    console.log(file);
  }





  // Возраст до даты
  public ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }
}
