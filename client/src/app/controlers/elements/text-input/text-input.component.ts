import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";





@Component({
  selector: "app-text-input",
  templateUrl: "./text-input.component.html",
  styleUrls: ["./text-input.component.scss"]
})





export class TextInputComponent extends BaseInputDirective {


  @Input() public label: string;
  @Input() public type: "text" | "password" | "email" | "date" = "text";
  @Input() public maxLength: number = 100;
  @Input() public appearance: MatFormFieldAppearance = "fill";
  @Input() public minDate: Date;
  @Input() public maxDate: Date;

  @Output() public submitCallback: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("input") input: ElementRef;

  public showPassword: boolean = false;





  // Нажатие на кнопки клавиатуры
  public onKeyup(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      this.submitCallback.emit();
    }
  }





  // Переключить отображение пароля
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
