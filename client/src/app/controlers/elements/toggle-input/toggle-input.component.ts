import { Component, Input } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@app/directives/base-input.directive";





@Component({
  selector: "app-toggle-input",
  templateUrl: "./toggle-input.component.html",
  styleUrls: ["./toggle-input.component.scss"]
})

export class ToggleInputComponent extends BaseInputDirective {


  @Input() override label: string = "Заголовок";
  @Input() values: [string, string] = ["Параметр 1", "Параметр 2"];
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() errorText: boolean = false;





  // Выбрано
  get isChecked(): boolean {
    return !!this.control.value;
  }
}
