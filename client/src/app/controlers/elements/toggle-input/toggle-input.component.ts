import { Component, Input, OnChanges } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@app/directives/base-input.directive";





// Декоратор
@Component({
  selector: "app-toggle-input",
  templateUrl: "./toggle-input.component.html",
  styleUrls: ["./toggle-input.component.scss"]
})

// Класс
export class ToggleInputComponent extends BaseInputDirective {


  @Input() override label: string = "Заголовок";
  @Input() values: [string, string] = ["Параметр 1", "Параметр 2"];
  @Input() appearance: MatFormFieldAppearance = "fill";

  get isChecked(): boolean {
    return !!this.control.value;
  }
}