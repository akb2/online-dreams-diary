import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { SnackbarService } from "@_services/snackbar.service";





@Component({
  selector: "app-image-upload",
  templateUrl: "./image-upload.component.html",
  styleUrls: ["./image-upload.component.scss"]
})

export class ImageUploadComponent extends BaseInputDirective implements OnInit {


  @Input() public appearance: MatFormFieldAppearance = "fill";
  @Input() public fileTypes: FileTypes[] = FileTypesDefault;
  @Input() public fileSize: number = 10485760;
  @Input() public autoUpload: boolean = false;

  @Output() public beforeGetFile: EventEmitter<File> = new EventEmitter<File>();
  @Output() public afterGetFile: EventEmitter<File> = new EventEmitter<File>();
  @Output() public upload: EventEmitter<File> = new EventEmitter<File>();

  @ViewChild("fileInput") public fileInput: ElementRef;

  public newValue: string;
  private defaultValue: string = "";

  public get imageUrl(): string {
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

  public get availSave(): boolean {
    return this.newValue?.length > 0;
  }

  constructor(
    public ngControl: NgControl,
    private snackbarService: SnackbarService
  ) {
    super(ngControl);
  }





  // Запуск класса
  public ngOnInit(): void {
    this.defaultValue = this.control.value;
  }

  // Выбор файла
  public onSelectFiles(files: FileList): void {
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
          message: "Превышен допустимый размер файла в " + this.convertSize(this.fileSize),
          mode: "error"
        });
      }
    }
  }

  // Загрузка файла
  public onUpload(): void {
    if (this.control.value && typeof this.control.value === "object") {
      this.upload.emit(this.control.value);
    }
  }





  // Сбросить значение
  public clearInput(value: string | null = this.defaultValue): void {
    this.defaultValue = value;
    this.control.setValue(value);
    this.newValue = "";
    // Очистить поле
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }

  // Получить размер файла
  private convertSize(size: number): string {
    const strings: string[] = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
    let key: number = 0;
    // Преобразовать данные
    while (size > 1024 && key < strings.length) {
      size = size / 1024;
      key++;
    }
    // Преобразование неудалось
    return Math.round(size) + " " + strings[key];
  }
}





// Допустимые типы файлов
type FileTypes = "image/gif" | "image/jpeg" | "image/png";

// Типы файлов по умолчанию
export const FileTypesDefault: FileTypes[] = [
  "image/jpeg",
  "image/png"
];