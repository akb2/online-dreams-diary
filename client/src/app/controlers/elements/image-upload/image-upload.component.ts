import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { AvatarMaxSize, ConvertFileSize, FileTypesDefault } from "@_datas/app";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { FileTypes } from "@_models/app";
import { SnackbarService } from "@_services/snackbar.service";





@Component({
  selector: "app-image-upload",
  templateUrl: "./image-upload.component.html",
  styleUrls: ["./_image-upload.component.scss"]
})

export class ImageUploadComponent extends BaseInputDirective implements OnInit {


  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() fileTypes: FileTypes[] = FileTypesDefault;
  @Input() fileSize: number = AvatarMaxSize;
  @Input() autoUpload: boolean = false;

  @Output() beforeGetFile: EventEmitter<File> = new EventEmitter<File>();
  @Output() afterGetFile: EventEmitter<File> = new EventEmitter<File>();
  @Output() upload: EventEmitter<File> = new EventEmitter<File>();

  @ViewChild("fileInput") fileInput: ElementRef;

  newValue: string;
  private defaultValue: string = "";

  get imageUrl(): string {
    if (this.newValue?.length > 0) {
      return this.newValue;
    }
    // Показать изначальное значение
    else if (typeof this.control.value === "string" && this.control.value?.length > 0) {
      return this.control.value;
    }
    // Нет картинки
    return "";
  }

  get availSave(): boolean {
    return this.newValue?.length > 0;
  }

  constructor(
    ngControl: NgControl,
    private snackbarService: SnackbarService
  ) {
    super(ngControl);
  }





  // Запуск класса
  ngOnInit(): void {
    this.defaultValue = this.control.value;
  }

  // Выбор файла
  onSelectFiles(files: FileList): void {
    if (files?.length > 0) {
      const file: File = files[0];
      const fileReader: FileReader = new FileReader();
      // Установить новую временную картинку
      if (file.size <= this.fileSize) {
        this.beforeGetFile.emit(file);
        // Работа с файлом
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          this.afterGetFile.emit(file);
          this.control.setValue(file);
          this.newValue = fileReader.result as string;
          // Автозагрузка
          if (this.autoUpload) {
            this.onUpload();
          }
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

  // Загрузка файла
  onUpload(): void {
    if (this.control.value && typeof this.control.value === "object") {
      this.upload.emit(this.control.value);
    }
  }





  // Сбросить значение
  clearInput(value: string | null = this.defaultValue): void {
    this.defaultValue = value;
    this.control.setValue(value);
    this.newValue = "";
    // Очистить поле
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }
}
