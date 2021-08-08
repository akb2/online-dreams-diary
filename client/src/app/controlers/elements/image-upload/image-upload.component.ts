import { Component, Input } from "@angular/core";
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
}
