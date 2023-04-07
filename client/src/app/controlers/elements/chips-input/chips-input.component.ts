import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, DoCheck, EventEmitter, Input, OnInit, Optional, Output, Self, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { MatChipInput, MatChipInputEvent } from "@angular/material/chips";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { ThemePalette } from "@angular/material/core";





@Component({
  selector: "app-chips-input",
  templateUrl: "./chips-input.component.html",
  styleUrls: ["./chips-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChipsInputComponent extends BaseInputDirective implements DoCheck, OnInit {


  @ViewChild(MatChipInput) private input!: MatChipInput;

  @Input() placeholder: string = "Введите текст";
  @Input() placeholderLimit: string = "Введено максимум значений";
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() separator: string = ",";
  @Input() disableSymbols: string[] = DefaultDisabledChar;
  @Input() maxLength: number = 512;
  @Input() color: ThemePalette | "" = "";

  @Output() keyDown: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  @Output() keyUp: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

  words: string[];

  private oldValues: string[];





  // Максимальная длина ввода в ключевые слова
  get inputMaxLength(): number {
    const length: number = this.words.join(this.separator).length;
    const maxLength: number = this.maxLength - length - (length > 0 ? this.separator.length : 0);
    // Вернуть значение
    return maxLength > 0 ? maxLength : 0;
  }

  // Заполнитель ввода
  get inputPlaceholder(): string {
    return this.inputMaxLength > 0 ? this.placeholder : this.placeholderLimit;
  }





  constructor(
    @Optional() @Self() override controlDir: NgControl
  ) {
    super(controlDir);
  }

  override ngDoCheck() {
    super.ngDoCheck();
    // Проверка значений
    if ((this.oldValues || []).join(this.separator) != (this.control.value || []).join(this.separator)) {
      // Обновить проверочные значения
      this.oldValues = this.control.value.slice();
      // Обновить
      this.createWords();
    }
  }

  ngOnInit() {
    this.createWords();
  }





  // Добавить слово
  onAddWord(event: MatChipInputEvent): void {
    event.value = this.correctWord(event.value);
    // Если слова нет в списке
    if (event.value.length > 0 && !this.words.some(v => v.toLowerCase() === event.value.toLowerCase())) {
      this.words.push(event.value);
      // Очистить поле
      event.chipInput.clear();
      // Добавить в форму
      this.control.setValue(this.words);
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
    }
  }

  // Изменить порядок слов
  onDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.words, event.previousIndex, event.currentIndex);
    // Запомнить значение
    this.control.setValue(this.words);
  }

  // Ввод текста с клавиатуры
  onKeyDown(event: KeyboardEvent): void {
    this.keyDown.emit(event);
  }

  // Ввод текста с клавиатуры
  onKeyUp(event: KeyboardEvent): void {
    this.keyUp.emit(event);
    // Найден разделитель
    if (this.separator === event.key) {
      const input: HTMLInputElement = this.input.inputElement;
      const values: string[] = (event.target["value"] || "").split(this.separator).map(v => this.correctWord(v));
      // Добавить слово
      values.forEach(value => this.onAddWord({ value, input, chipInput: this.input }));
    }
    // Введен запрещенный символ
    else if (this.disableSymbols.includes(event.key)) {
      const value: string = this.correctWord(event.target["value"]);
      event.target["value"] = value;
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
    else {
      this.words = [];
    }
  }

  // Скорректировать слово
  private correctWord(value: string): string {
    const regDis = new RegExp("([\\" + this.disableSymbols.join("\\") + "]+)", "i");
    // Настройки слова
    value = value || "";
    value = value.replace(regDis, "");
    value = value.trim();
    // Вернуть слово
    return value;
  }
}





// Список запрещенных символов по умолчанию
export const DefaultDisabledChar: string[] = [
  "\`",
  "\~",
  "\!",
  "\@",
  "\"",
  "\#",
  "\№",
  "\$",
  "\;",
  "\%",
  "\^",
  "\:",
  "\&",
  "\?",
  "\*",
  "\(",
  "\)",
  "\+",
  "\=",
  "\'",
  "\\",
  "\|",
  "\/",
  "\<",
  "\>",
  "\,",
  "\."
];
