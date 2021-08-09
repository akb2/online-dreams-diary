import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";





// Декоратор
@Component({
  selector: "app-image-upload",
  templateUrl: "./image-upload.component.html",
  styleUrls: ["./image-upload.component.scss"]
})

// Класс
export class ImageUploadComponent extends BaseInputDirective {


  @Input() public label: string;
  @Input() public appearance: MatFormFieldAppearance = "fill";

  @Output() public upload: EventEmitter<File> = new EventEmitter<File>();

  public newValue: string;

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





  // Выбор файла
  public onSelectFiles(files: FileList): void {
    if (files?.length > 0) {
      const file: File = files[0];
      const fileReader: FileReader = new FileReader();
      // Установить новую временную картинку
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        this.control.setValue(file);
        this.newValue = fileReader.result as string;
      }
    }
  }

  // Загрузка файла
  public onUpload(): void {
    if (this.control.value && typeof this.control.value === "object") {
      this.upload.emit(this.control.value);
    }
  }
}
