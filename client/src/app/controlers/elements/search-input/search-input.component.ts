import { ChangeDetectionStrategy, Component, EventEmitter, Output } from "@angular/core";
import { FormControl } from "@angular/forms";
import { BaseInputDirective } from "@_directives/base-input.directive";





@Component({
  selector: "app-search-input",
  templateUrl: "./search-input.component.html",
  styleUrls: ["./search-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchInputComponent extends BaseInputDirective {

  @Output() search: EventEmitter<string> = new EventEmitter();


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
