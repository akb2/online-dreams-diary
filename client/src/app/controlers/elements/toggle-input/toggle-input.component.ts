import { Component, Input, OnInit } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@app/directives/base-input.directive";





@Component({
  selector: "app-toggle-input",
  templateUrl: "./toggle-input.component.html",
  styleUrls: ["./toggle-input.component.scss"]
})
export class ToggleInputComponent extends BaseInputDirective {
  @Input() public label: string = "Заголовок";
  @Input() public values: [string, string] = ["Параметр 1", "Параметр 2"];
  @Input() public appearance: MatFormFieldAppearance = "fill";
}