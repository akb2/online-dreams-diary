import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { FormControl } from "@angular/forms";
import { BaseInputDirective } from "@_directives/base-input.directive";





@Component({
  selector: "app-search-input",
  templateUrl: "./search-input.component.html",
  styleUrls: ["./search-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchInputComponent extends BaseInputDirective {

  @Input() buttonText: string = "Найти";

  @Output() search: EventEmitter<string> = new EventEmitter();
  @Output() clear: EventEmitter<void> = new EventEmitter();


  // Проверка значения поиска
  get isSearching(): boolean {
    const control: FormControl = this.control as FormControl;
    // Проверка
    return !!control?.value?.toString()?.length;
  }





  // Очистить поиск
  onClear(): void {
    const control: FormControl = this.control as FormControl;
    // Очистка
    if (!!control) {
      control.setValue("");
      this.clear.emit();
    }
  }

  // Поиск
  onSearch(): void {
    const control: FormControl = this.control as FormControl;
    const value: string = control?.value?.toString() ?? "";
    // Вызов события
    this.search.emit(value);
  }
}
