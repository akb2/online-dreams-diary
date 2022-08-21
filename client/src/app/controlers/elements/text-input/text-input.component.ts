import { DatePipe } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { filter, map, Subject, takeUntil, tap, timer } from "rxjs";





@Component({
  selector: "app-text-input",
  templateUrl: "./text-input.component.html",
  styleUrls: ["./text-input.component.scss"]
})

export class TextInputComponent extends BaseInputDirective implements OnInit, OnDestroy {


  @Input() id: string;
  @Input() name: string;
  @Input() autocomplete: string = "off";
  @Input() type: TextInputType = "text";
  @Input() maxLength: number = 100;
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() minDate: Date;
  @Input() multiLine: boolean = false;
  @Input() multiLineMinLines: number = 1;
  @Input() multiLineMaxLines: number = 10;
  @Input() maxDate: Date;
  @Input() submitAfterActivity: boolean = false;
  @Input() activityTimer: number = 500;

  @Output() submit: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("input") input: ElementRef;

  showPassword: boolean = false;
  datePipe: DatePipe = new DatePipe('ru-RU');

  private lastActivity: number = +new Date();
  private activityInterval: number = 100;
  private oldValue: string | null = "";

  private destroy$: Subject<void> = new Subject<void>();





  ngOnInit(): void {
    this.oldValue = this.value?.toString() ?? "";
    // Таймер проверки активности
    timer(this.activityInterval, this.activityInterval)
      .pipe(
        takeUntil(this.destroy$),
        map(() => +new Date()),
        filter(t => t - this.lastActivity > this.activityTimer && this.submitAfterActivity),
        map(() => this.input.nativeElement.value),
        filter(value => value !== this.oldValue),
      )
      .subscribe(value => {
        this.lastActivity = +new Date();
        this.oldValue = value;
        // Сабмит
        this.onSubmit();
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Нажатие на кнопки клавиатуры
  onKeyDown(event: KeyboardEvent): void {
    this.lastActivity = +new Date();
  }

  // Нажатие на кнопки клавиатуры
  onKeyPress(event: KeyboardEvent): void {
    this.lastActivity = +new Date();
  }

  // Нажатие на кнопки клавиатуры
  onKeyUp(event: KeyboardEvent): void {
    const sep: string = "\\" + DateSeparators.join("|\\");
    const value: string | null = this.input.nativeElement.value;
    // Записать активность
    this.lastActivity = +new Date();
    // Отправка формы
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      // Нажатый Ctrl
      if (event.ctrlKey && this.multiLine) {
      }
      // Сабмит
      else {
        this.onSubmit();
      }
    }
    // Форматирование даты
    else if (this.type === "date" && value && new RegExp(`(\\d{1,2})(${sep})(\\d{1,2})(${sep})(\\d{4})`, "i").test(value)) {
      this.onSubmit();
    }
  }

  // Нажатие Enter на клавиатуре
  private onSubmit(): void {
    const value: string | null = this.input.nativeElement.value;
    // Для даты
    if (this.type === "date" && value) {
      const date: Date | null = this.checkDate(value);
      //  Установить значение
      this.control.setValue(date ? date : "");
    }
    // Остальные
    else if (this.type !== "date") {
      this.submit.emit();
    }
  }





  // Переключить отображение пароля
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Проверка даты
  private checkDate(value: string | null): Date | null {
    if (value) {
      let date: Date = new Date();
      // Парсинг даты
      for (const sep of DateSeparators) {
        if (new RegExp("\\" + sep, "i").test(value)) {
          const [day, month, year]: number[] = value.split(sep).map(v => parseInt(v, 10));
          const maxDay: number = 31;
          const maxMonth: number = 12;
          const minYear: number = 1900;
          // Валидная дата
          if (day > 0 && day <= maxDay && month > 0 && month <= maxMonth && year > minYear && year <= new Date().getFullYear()) {
            date = new Date(year, month - 1, day);
          }
          // Остановить цикл
          break;
        }
      }
      // Вернуть дату
      return isNaN(date.getTime()) ? null : date;
    }
    // Нуль
    return null;
  }
}





// Интерфейс типов полей
export type TextInputType = "text" | "password" | "email" | "tel" | "date" | "number";

// Сеператоры даты
const DateSeparators: string[] = [" ", "-", ".", ",", "/", "\\"];
