import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, Optional, Self } from "@angular/core";
import { NgControl } from "@angular/forms";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";





@Component({
  selector: "app-chips-input",
  templateUrl: "./chips-input.component.html",
  styleUrls: ["./chips-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChipsInputComponent extends BaseInputDirective implements OnInit {


  @Input() label: string = "";
  @Input() placeholder: string = "Введите текст";
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() separator: string = ",";

  words: string[];





  constructor(
    @Optional() @Self() public controlDir: NgControl,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir);
  }

  ngOnInit() {
    this.createWords();
  }





  // Добавить слово
  onAddWord(event: MatChipInputEvent): void {
    if (event.value.length > 0 && !this.words.some(v => v.toLowerCase() === event.value.toLowerCase())) {
      this.words.push(event.value);
      event.chipInput.clear();
      // Добавить в форму
      this.control.setValue(this.words);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  // Удалить слово
  onRemoveWord(word: string): void {
    const key: number = this.words.findIndex(v => v.toLowerCase() === word.toLowerCase());
    // Удалить слово
    if (key >= 0) {
      this.words.splice(key, 1);
      // Добавить в форму
      this.control.setValue(this.words);
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }





  // Определить данные
  private createWords(): void {
    const mixedValue: string | string[] | number | number[] = this.control.value;
    // Если получен массив
    if (Array.isArray(mixedValue)) {
      this.words = mixedValue.map((v: string | number) => v.toString());
    }
    // Если строка
    else if (typeof mixedValue === "string") {
      this.words = mixedValue.split(this.separator);
    }
    // Если число
    else if (typeof mixedValue === "number") {
      this.words = [mixedValue.toString()];
    }
    // Пустой результат
    this.words = [];
  }
}