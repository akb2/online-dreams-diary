import { PopupConfirmComponent, PopupConfirmData } from "@_controlers/confirm/confirm.component";
import { PopupCropImageComponent, PopupCropImageData } from "@_controlers/crop-image/crop-image.component";
import { AvatarMaxSize, ConvertFileSize, FileTypesDefault } from "@_datas/app";
import { ImageRightRotate } from "@_helpers/image";
import { User, UserAvatarCropDataElement, UserAvatarCropDataKeys } from "@_models/account";
import { FileTypes } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { SnackbarService } from "@_services/snackbar.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { Subject, concatMap, filter, takeUntil, tap } from "rxjs";

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
    private matDialog: MatDialog,
    private translateService: TranslateService
  ) {
    this.avatarForm = this.formBuilder.control(null);
  }

  ngOnChanges(): void {
    this.avatarForm.setValue(this.user?.avatars?.full);
    this.showDefaultAva = false;
    this.loadingAvatar = false;
    // Остановить загрузчик при отсутствии аватарки
    if (!this.getCheckVisitedUserHasAvatar) {
      this.showDefaultAva = true;
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Выбор файла
  onSelectFiles(event: Event): void {
    const files: FileList = (<HTMLInputElement>event?.target)?.files;
    // Файлы выбраны
    if (files?.length > 0) {
      const file: File = files[0];
      // Установить новую временную картинку
      if (file.size <= this.fileSize) {
        this.loadingAvatar = true;
        this.changeDetectorRef.detectChanges();
        // Работа с файлом
        ImageRightRotate(file)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(({ file }) => {
            this.avatarForm.setValue(file);
            this.onUploadAvatar(file);
          });
      }
      // Сбросить форму
      else {
        const units: string[] = this.translateService.instant("general.units.file_size");
        const size: string = ConvertFileSize(this.fileSize, units);
        const message: string = this.translateService.instant("pages.profile.blocks.avatar.notifications.file_limit", { size });
        // Очистить поле
        this.clearInput();
        // Сообщение
        this.snackbarService.open({ message, mode: "error" });
      }
    }
  }

  // Открыть окно обрезки
  onOpenCrop(type: UserAvatarCropDataKeys): void {
    if (this.user) {
      const data: PopupCropImageData = {
        title: "pages.profile.blocks.avatar.popups.avatar_title",
        image: this.user.avatars.full,
        coords: this.user.avatarCropData.crop,
        minimal: [400, 400],
        verticalAspectRatio: [1, 2],
        horizontalAspectRatio: [4, 3]
      };
      // Для обрезки основной фотки
      if (type === "middle") {
        data.title = "pages.profile.blocks.avatar.popups.thumbnail_title";
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
        .subscribe((position: UserAvatarCropDataElement) => this.onSaveCropPosition(type, position as UserAvatarCropDataElement));
    }
  }

  // Удаление аватарки
  onDeleteAvatar(): void {
    const dialog: MatDialogRef<PopupConfirmComponent, PopupConfirmData> = PopupConfirmComponent.open(this.matDialog, {
      title: "popups.delete_avatar.title",
      text: "popups.delete_avatar.description"
    });
    // Открытие окна
    dialog.afterClosed()
      .pipe(
        takeUntil(this.destroyed$),
        filter(result => !!result),
        tap(() => {
          this.loadingAvatar = true;
          this.changeDetectorRef.detectChanges();
        }),
        concatMap(() => this.accountService.deleteAvatar())
      )
      .subscribe(
        code => {
          this.loadingAvatar = false;
          // Успешная обрезка аватарки
          if (code == "0001") {
            this.clearInput();
            // Уведомление
            this.snackbarService.open({
              message: this.translateService.instant("pages.profile.blocks.avatar.notifications.success_delete"),
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
                message: this.translateService.instant("pages.profile.blocks.avatar.notifications.success_upload"),
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
        message: this.translateService.instant("pages.profile.blocks.avatar.notifications.file_other"),
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
              const message: string = this.translateService.instant(type === "crop"
                ? "pages.profile.blocks.avatar.notifications.success_avatar_crop"
                : "pages.profile.blocks.avatar.notifications.success_thumbnail_crop"
              );
              // Уведомление
              this.snackbarService.open({ message, mode: "success" });
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
