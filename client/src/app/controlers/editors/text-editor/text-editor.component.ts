import { BaseInputDirective } from "@_directives/base-input.directive";
import { ChangeDetectionStrategy, Component, Optional, Self } from "@angular/core";
import { NgControl } from "@angular/forms";





@Component({
  selector: "app-text-editor",
  templateUrl: "./text-editor.component.html",
  styleUrls: ["./text-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TextEditorComponent extends BaseInputDirective {

  constructor(
    @Optional() @Self() override controlDir: NgControl,
  ) {
    super(controlDir);
  }
}
