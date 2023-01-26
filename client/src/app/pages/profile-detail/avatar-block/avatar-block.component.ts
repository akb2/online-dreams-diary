import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { PopupCropImageComponent, PopupCropImageData } from "@_controlers/crop-image/crop-image.component";
import { AvatarMaxSize, ConvertFileSize, FileTypesDefault } from "@_datas/app";
import { User, UserAvatarCropDataElement, UserAvatarCropDataKeys } from "@_models/account";
import { FileTypes } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { SnackbarService } from "@_services/snackbar.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-avatar-block",
  templateUrl: "./avatar-block.component.html",
  styleUrls: ["./avatar-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AvatarBlockComponent implements OnChanges, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  @ViewChild("fileInput") fileInput: ElementRef;

  fileTypes: FileTypes[] = FileTypesDefault;
  avatarForm: FormControl;
  private fileSize: number = AvatarMaxSize;

  loadingAvatar: boolean = true;
  private showDefaultAva: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  // У пользователя есть аватарка
  get getVisitedUserHasAvatar(): boolean {
    return this.getCheckVisitedUserHasAvatar && !this.showDefaultAva;
  }

  // Проверить аватарку
  private get getCheckVisitedUserHasAvatar(): boolean {
    return (
      !!this.user &&
      !!this.user.avatars &&
      !!this.user.avatars.full &&
      !!this.user.avatars.middle &&
      !!this.user.avatars.crop &&
      !!this.user.avatars.small
    );
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService,
    private accountService: AccountService,
    private matDialog: MatDialog
  ) {
    this.avatarForm = this.formBuilder.control(null);
  }

  ngOnChanges(): void {
    this.avatarForm.setValue(this.user?.avatars?.full);
    this.showDefaultAva = false;
    // Остановить загрузчик при отсутствии аватарки
    if (!this.getCheckVisitedUserHasAvatar) {
      this.loadingAvatar = false;
      this.showDefaultAva = true;
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Аватарка загружена
  onAvatarLoadSuccess(): void {
    this.showDefaultAva = false;
    this.loadingAvatar = false;
    this.changeDetectorRef.detectChanges();
  }

  // Аватарка загружена
  onAvatarLoadError(): void {
    this.showDefaultAva = true;
    this.loadingAvatar = false;
    this.changeDetectorRef.detectChanges();
  }

  // Выбор файла
  onSelectFiles(files: FileList): void {
    if (files?.length > 0) {
      const file: File = files[0];
      const fileReader: FileReader = new FileReader();
      // Установить новую временную картинку
      if (file.size <= this.fileSize) {
        this.loadingAvatar = true;
        this.changeDetectorRef.detectChanges();
        // Работа с файлом
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          this.avatarForm.setValue(file);
          this.onUploadAvatar(file);
        };
      }
      // Сбросить форму
      else {
        this.clearInput();
        // Сообщение
        this.snackbarService.open({
          message: "Превышен допустимый размер файла в " + ConvertFileSize(this.fileSize),
          mode: "error"
        });
      }
    }
  }

  // Открыть окно обрезки
  onOpenCrop(type: UserAvatarCropDataKeys): void {
    if (this.user) {
      const data: PopupCropImageData = {
        title: "Обрезка аватарки",
        image: this.user.avatars.full,
        coords: this.user.avatarCropData.crop,
        minimal: [400, 400],
        verticalAspectRatio: [1, 2],
        horizontalAspectRatio: [4, 3]
      };
      // Для обрезки основной фотки
      if (type === "middle") {
        data.title = "Создание миниатюры";
        data.image = this.user.avatars.crop;
        data.coords = this.user.avatarCropData.middle;
        data.aspectRatio = [1, 1];
        data.minimal = [180, 180];
        // Удалить параметры
        data.verticalAspectRatio = null;
        data.horizontalAspectRatio = null;
      }
      // Диалог
      const dialog = PopupCropImageComponent.open(this.matDialog, data);
      // Открыть диалог
      dialog.afterClosed()
        .pipe(takeUntil(this.destroyed$))
        .subscribe((position: UserAvatarCropDataElement | null) => this.onSaveCropPosition(type, position as UserAvatarCropDataElement));
    }
  }

  // Удаление аватарки
  onDeleteAvatar(): void {
    const dialog = PopupConfirmComponent.open(this.matDialog, {
      title: "Удаление аватарки",
      text: "Вы действительно хотите удалить свою аватарку с сайта?"
    });
    dialog.afterClosed()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(result => {
        if (result) {
          this.loadingAvatar = true;
          this.changeDetectorRef.detectChanges();
          // Запрос на сервер
          this.accountService.deleteAvatar()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(
              code => {
                this.loadingAvatar = false;
                // Успешная обрезка аватарки
                if (code == "0001") {
                  this.clearInput();
                  this.snackbarService.open({
                    message: "Ваша аватарка успешно удалена",
                    mode: "success"
                  });
                }
                // Изменения
                this.changeDetectorRef.detectChanges();
              },
              () => {
                this.loadingAvatar = false;
                this.changeDetectorRef.detectChanges();
              }
            );
        }
      });
  }

  // Загрузка аватарки
  private onUploadAvatar(file: File): void {
    // Файл без ошибок
    if (file) {
      this.loadingAvatar = true;
      this.changeDetectorRef.detectChanges();
      // Загрузка аватарки
      this.accountService.uploadAvatar(file)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          code => {
            // Успешная загрузка аватарки
            if (code == "0001") {
              this.snackbarService.open({
                message: "Аватарка успешно загружена",
                mode: "success"
              });
              // Обрезать аватарку
              this.onOpenCrop("crop");
            }
            // Ощибка загрузки
            else {
              this.loadingAvatar = false;
            }
            // Изменения
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.loadingAvatar = false;
            this.clearInput();
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

  // Сохранить позицию обрезанной фотки
  private onSaveCropPosition(type: UserAvatarCropDataKeys, position: UserAvatarCropDataElement): void {
    if (position) {
      this.loadingAvatar = true;
      this.changeDetectorRef.detectChanges();
      // Запрос на сервер
      this.accountService.cropAvatar(type, position)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          code => {
            this.loadingAvatar = false;
            // Успешная обрезка аватарки
            if (code == "0001") {
              this.snackbarService.open({
                message: type === "crop" ? "Основная аватарка успешно обрезана" : "Миниатюра аватарки успешно обрезана",
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
            this.loadingAvatar = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
  }

  // Сбросить значение
  private clearInput(): void {
    this.avatarForm.setValue(this.getVisitedUserHasAvatar);
    // Очистить поле
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }
}
