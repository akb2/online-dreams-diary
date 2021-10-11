import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PopupConfirmComponent } from '@_controlers/confirm/confirm.component';
import { PopupCropImageComponent, PopupCropImageData } from '@_controlers/crop-image/crop-image.component';
import { ImageUploadComponent } from '@_controlers/image-upload/image-upload.component';
import { CustomValidators } from '@_helpers/custom-validators';
import { User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserSave } from '@_models/account';
import { ErrorMessages, ErrorMessagesType, FormData, FormDataType, ValidatorData } from '@_models/form';
import { AccountService } from '@_services/account.service';
import { SnackbarService } from '@_services/snackbar.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';





// Декоратор компонента
@Component({
  selector: 'app-settings-person-profile',
  templateUrl: './settings-person.component.html',
  styleUrls: ['./settings-person.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Основной класс
export class SettingsPersonProfileComponent implements OnInit, OnDestroy {


  @ViewChild(ImageUploadComponent) appImageUpload: ImageUploadComponent;

  public form: FormGroup;
  public avatar: FormControl;
  public errors: ErrorMessagesType = ErrorMessages;
  public formData: FormDataType = FormData;
  public user: User;

  public dataLoading: boolean;
  public fileLoading: boolean;

  public fileLoaderTitles: string[][] = [
    ["Отправка на сервер", "Пожалуйста подождите"],
    ["Подготовка файла", "Пожалуйста подождите"]
  ];
  public fileLoaderKey: number = 0;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // Настройка формы
    this.form = this.formBuilder.group({
      name: ["", ValidatorData.name],
      lastName: ["", ValidatorData.name],
      patronymic: ["", ValidatorData.name],
      birthDate: ["", ValidatorData.birthDate],
      sex: [false],
      email: ["", ValidatorData.email],
      testEmail: [[], null],
      avatar: null
    }, {
      validators: [
        CustomValidators.uniqueEmailData
      ]
    });
    this.avatar = this.formBuilder.control(null);
  }

  ngOnInit() {
    this.subscribeUser().subscribe(user => {
      this.user = user;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  public onSaveData(): void {
    // Форма без ошибок
    if (this.form.valid) {
      this.dataLoading = true;
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
      this.accountService.saveUserData(userSave, ["9012"]).subscribe(
        code => {
          this.dataLoading = false;
          // Успешная регистрация
          if (code == "0001") {
            this.snackbarService.open({
              message: "Данные успешно сохранены",
              mode: "success"
            });
          }
          // Ошибка почты
          else if (code == "9012") {
            const testEmail: string[] = this.form.get("testEmail").value;
            if (testEmail.every(email => email !== userSave.email)) {
              testEmail.push(userSave.email);
            }
          }
          // Изменения
          this.changeDetectorRef.detectChanges();
        },
        () => {
          this.dataLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      );
    }
    // Есть ошибки
    else {
      this.form.markAllAsTouched();
    }
  }

  // Перед выбором файла
  public onBeforeGetFile(file: File): void {
    this.fileLoaderKey = 1;
    this.fileLoading = true;
  }

  // После выбора файла
  public onAfterGetFile(file: File): void {
    this.fileLoading = false;
  }

  // Загрузка аватарки
  public onUploadAvatar(file: File): void {
    // Файл без ошибок
    if (file) {
      this.fileLoaderKey = 0;
      this.fileLoading = true;
      // Загрузка аватарки
      this.accountService.uploadAvatar(file).subscribe(
        code => {
          this.fileLoading = false;
          // Успешная загрузка аватарки
          if (code == "0001") {
            this.snackbarService.open({
              message: "Аватарка успешно загружена",
              mode: "success"
            });
            // Обрезать аватарку
            this.onOpenCrop("crop");
          }
          // Изменения
          this.changeDetectorRef.detectChanges();
        },
        () => {
          this.fileLoading = false;
          this.appImageUpload.clearInput();
          this.changeDetectorRef.detectChanges();
        }
      );
    }
    // Ошибка файла
    else {
      this.snackbarService.open({
        message: "Ошибка файла, выберите подходящий файл",
        mode: "error"
      });
    }
  }

  // Открыть окно обрезки
  public onOpenCrop(type: UserAvatarCropDataKeys): void {
    if (this.user) {
      const data: PopupCropImageData = {
        title: "Обрезка аватарки",
        image: this.user.avatars.full,
        coords: this.user.avatarCropData.crop,
        minimal: [400, 400]
      };
      // Для обрезки основной фотки
      if (type === "middle") {
        data.title = "Создание миниатюры";
        data.image = this.user.avatars.crop;
        data.coords = this.user.avatarCropData.middle;
        data.aspectRatio = [1, 1];
        data.minimal = [180, 180];
      }
      // Диалог
      const dialog = PopupCropImageComponent.open(this.matDialog, data);
      dialog.afterClosed().subscribe((position: UserAvatarCropDataElement | null) => this.onSaveCropPosition(type, position as UserAvatarCropDataElement));
    }
  }

  // Сохранить позицию обрезанной фотки
  public onSaveCropPosition(type: UserAvatarCropDataKeys, position: UserAvatarCropDataElement): void {
    if (position) {
      this.fileLoading = true;
      // Запрос на сервер
      this.accountService.cropAvatar(type, position).subscribe(
        code => {
          this.fileLoading = false;
          // Успешная обрезка аватарки
          if (code == "0001") {
            this.snackbarService.open({
              message: type === 'crop' ? "Основная аватарка успешно обрезана" : "Миниатюра аватарки успешно обрезана",
              mode: "success"
            });
            // Открыть изменение миниатюры
            if (type === "crop") {
              this.onOpenCrop("middle");
            }
          }
          // Изменения
          this.changeDetectorRef.detectChanges();
        },
        () => {
          this.fileLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      );
    }
  }

  // Удаление аватарки
  public onDeleteAvatar(): void {
    const dialog = PopupConfirmComponent.open(this.matDialog, {
      title: "Удаление аватарки",
      text: "Вы действительно хотите удалить свою аватарку с сайта?"
    });
    dialog.afterClosed().subscribe(result => {
      if (result) {
        this.fileLoading = true;
        // Запрос на сервер
        this.accountService.deleteAvatar().subscribe(
          code => {
            this.fileLoading = false;
            // Успешная обрезка аватарки
            if (code == "0001") {
              this.appImageUpload.clearInput(null);
              this.snackbarService.open({
                message: "Ваша аватарка успешно удалена",
                mode: "success"
              });
            }
            // Изменения
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.fileLoading = false;
            this.changeDetectorRef.detectChanges();
          }
        );
      }
    });
  }





  // Возраст до даты
  public ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }

  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      map(user => {
        if (user) {
          this.form.get("name").setValue(user.name);
          this.form.get("lastName").setValue(user.lastName);
          this.form.get("patronymic").setValue(user.patronymic);
          this.form.get("birthDate").setValue(new Date(user.birthDate));
          this.form.get("sex").setValue(user.sex == 1);
          this.form.get("email").setValue(user.email);
          this.avatar.setValue(user.avatars.full);
        }
        // Работа с аватаркой
        if (this.appImageUpload) {
          this.appImageUpload.clearInput(user.avatars.full);
        }
        // Вернуть юзера
        return user;
      })
    );
  }
}
