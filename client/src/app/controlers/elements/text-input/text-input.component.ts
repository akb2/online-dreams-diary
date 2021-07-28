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

  @ViewChild("input") input: ElementRef;

  public showPassword: boolean = false;





  // Переключить отображение пароля
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
