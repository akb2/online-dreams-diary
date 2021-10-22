import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatOption } from "@angular/material/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { IconBackground, IconColor } from "@_models/app";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-autocomplete-input",
  templateUrl: "./autocomplete-input.component.html",
  styleUrls: ["./autocomplete-input.component.scss"]
})

export class AutocompleteInputComponent extends BaseInputDirective implements OnInit, OnChanges, AfterViewInit, OnDestroy {


  @Input() label: string;
  @Input() type: AutocompleteType = "autocomplete";
  @Input() textDelimiter: string = " | ";
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() optionData: OptionData[] = [];
  @Input() panelWidth: string | number = "";
  @Input() buttonIcon: string;
  @Input() notNull: boolean = true;

  @Output() buttonCallback: EventEmitter<void> = new EventEmitter<void>();
  @Output() selectItemEvent: EventEmitter<FormControl> = new EventEmitter<FormControl>();

  @ViewChild("inputElement") inputElement: ElementRef;
  @ViewChild("autocompleteElement") autocompleteElement: ElementRef;
  @ViewChild("inputElement", { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  optionHasImage: boolean = false;
  optionDataFiltered: OptionData[] = [];
  optionDataSelected: OptionData | null;

  image: string = "";
  icon: string = "";
  iconColor: IconColor = "primary";
  iconBackground: IconBackground = "fill";
  imagePosition: AutocompleteImageSize = "cover";

  private focusTempValue: string;

  private destroy$: Subject<void> = new Subject<void>();
  private changes$: Subject<void> = new Subject<void>();





  ngOnChanges(changes: SimpleChanges): void {
    // Отключить старый вызов подписчика
    this.changes$.next();
    this.changes$.complete();
    // Поджписка на изменения
    this.control.valueChanges.pipe(takeUntil(this.destroy$), takeUntil(this.changes$)).subscribe(value => {
      this.setValue(value);
      this.optionDataFilter();
    });
    // Обработка значений
    this.optionDataFilter();
    this.setValue(this.control.value);
  }

  ngOnInit(): void {
    // События
    window.addEventListener("scroll", this.onScroll.bind(this), true);
  }

  ngAfterViewInit(): void {
    this.setValue(this.control.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // События
    window.removeEventListener("scroll", this.onScroll.bind(this), true);
  }





  // Изменение значения
  onKeyUp(event: KeyboardEvent, value: string): void {
    value = value.toLowerCase();
    // Очистить временное значение фокуса
    this.focusTempValue = "";

    // Поиск значения через Enter
    if (this.optionDataFiltered.length > 0 && (event.key === "Enter" || event.key === "NumpadEnter")) {
      if (this.optionDataFiltered.filter(option => this.getOptionText(option).toLowerCase().includes(value))) {
        const optionData: OptionData = this.optionDataFiltered.find(option => this.getOptionText(option).toLowerCase().includes(value)) as OptionData;
        // Закончить поиск
        this.setValue(optionData.key);
        this.autoComplete.closePanel();
      }
    }
    // Выбор при нажатии стрелок
    else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const activeOption: MatOption | null = this.autoComplete.activeOption;
      const optionData: OptionData | null = activeOption ? activeOption.value : null;
      // Найдено значение
      if (optionData) {
        this.setValue(optionData.key);
      }
    }
    // Установить значение при полном совпадении текста
    else if (this.optionDataFiltered.some(option => this.getOptionText(option).toLowerCase() === value)) {
      const optionData: OptionData = this.optionDataFiltered.find(option => this.getOptionText(option).toLowerCase() === value) as OptionData;
      this.setValue(optionData.key);
    }
    // Фильтрация массива значений
    else {
      this.optionDataFiltered = this.optionData.filter(option => this.getOptionText(option).toLowerCase().includes(value));
      this.setValue(null, false);
    }
  }

  // Поле в фокусе
  onFocus(event: FocusEvent): void {
    this.focusTempValue = this.inputElement.nativeElement.value;
    this.inputElement.nativeElement.value = "";
    // Убрать фильтрацию
    this.optionDataFiltered = this.optionData;
  }

  // Поле теряет фокус
  onBlur(event: FocusEvent): void {
    // Если временное значение не пусто
    if (this.focusTempValue.length) {
      this.inputElement.nativeElement.value = this.focusTempValue;
      this.focusTempValue = "";
    }
    // Выбранное значение
    else if (this.optionData.some(option => option.key === this.control.value)) {
      this.inputElement.nativeElement.value = this.getOptionText(this.optionData.find(option => option.key === this.control.value) as OptionData);
    }
  }

  // Нажатие на кнопку
  onButtonClick(): void {
    this.buttonCallback.emit();
    setTimeout(() => this.autoComplete.closePanel());
  }

  // Скролл документа
  private onScroll(event: Event): void {
    if (event.target === document || event.target === window) {
      this.autoComplete.closePanel();
    }
  }





  // Установить значение
  setValue(valueMixed: OptionData | number | string | null, setDefault: boolean = true, emitEvent: boolean = false): void {
    let optionData: OptionData | null = null;

    // Если значение строка
    if (typeof valueMixed === "string" || typeof valueMixed === "number") {
      optionData = this.findByKey(valueMixed + "");
      // Попробовать поиск по тексту
      if (!optionData) {
        optionData = this.findByTitle(valueMixed + "");
      }
    }
    // Если получен объект
    else if (valueMixed && typeof valueMixed === "object") {
      optionData = this.findByKey(valueMixed.key);
    }
    // Итоговое значение
    if (!optionData && setDefault && this.notNull) {
      optionData = this.optionData[0];
    }

    // Настройка поля с учетом значения
    if (optionData) {
      this.image = optionData.image ? optionData.image : "";
      this.imagePosition = optionData.imagePosition ? optionData.imagePosition : "cover";
      this.icon = optionData.icon ? optionData.icon : "";
      this.iconColor = optionData.iconColor ? optionData.iconColor : "primary";
      this.iconBackground = optionData.iconBackground ? optionData.iconBackground : "fill";
    }
    // Нет значения
    else {
      this.image = "";
      this.icon = "close";
      this.iconColor = "disabled";
      this.iconBackground = "fill";
    }

    // Установить значение
    if (optionData || (setDefault && this.notNull)) {
      this.control.setValue(optionData ? optionData.key : null, { emitEvent: false });
      this.optionDataSelected = optionData;
    }

    // Вызвать событие
    if (emitEvent) {
      this.selectItemEvent.emit(this.control);
    }
  }

  // Отображение в текстовом поле
  displayWith(value: OptionData | string | null): string {
    let optionData: OptionData | null = null;
    let returnValue: string = "";
    // Получена строка
    if (value && typeof value === "string") {
      // Найти по ключу
      optionData = this.findByKey(value);
      returnValue = optionData ? this.getOptionText(optionData) : value;
    }
    // Получен объект
    else if (value && typeof value === "object" && this.optionData.some(option => option.key === value.key)) {
      optionData = value;
      returnValue = optionData ? this.getOptionText(optionData) : "";
    }
    // Ничего не получено
    else {
      optionData = null;
      returnValue = typeof value === "string" ? value : "";
    }
    // Установить значение
    if (optionData) {
      this.setValue(optionData);
    }
    // Вернуть само значение
    return returnValue;
  }





  // Текстовое представление
  getOptionText(optionData: OptionData | null): string {
    if (optionData) {
      return optionData.title + (optionData.subTitle?.length ? this.textDelimiter + optionData.subTitle : "");
    }
    // Ошибка
    return "";
  }

  // Найти по ключу
  private findByKey(key: string): OptionData | null {
    if (key && this.optionData.some(option => option.key === key)) {
      return this.optionData.find(option => option.key === key) as OptionData;
    }
    // Ничего не найдено
    return null;
  }

  // Найти по ключу
  private findByTitle(title: string): OptionData | null {
    if (title && this.optionData.some(option => option.title === title || this.getOptionText(option) === title)) {
      return this.optionData.find(option => option.title === title || this.getOptionText(option) === title) as OptionData;
    }
    // Ничего не найдено
    return null;
  }

  // Фильтровать данные
  private optionDataFilter(): void {
    this.optionData = this.optionDataFill();
    this.optionDataFiltered = this.optionData;
  }

  // Дополнить массив данных
  private optionDataFill(): OptionData[] {
    this.optionHasImage = false;
    // Работа с массивом
    return this.optionData.map(option => {
      this.optionHasImage = option.image?.length || option.icon?.length ? true : this.optionHasImage;
      // Вернуть массив
      return {
        key: option.key?.length ? option.key : "",
        title: option.title?.length ? option.title : "",
        subTitle: option.subTitle?.length ? option.subTitle : "",
        image: option.image?.length ? option.image : "",
        icon: option.icon?.length ? option.icon : "",
        iconColor: option.iconColor?.length ? option.iconColor : "primary",
        iconBackground: option.iconBackground?.length ? option.iconBackground : "fill",
        imagePosition: option.imagePosition?.length ? option.imagePosition : "cover"
      };
    });
  }
}





// Допустимые типы полей
export type AutocompleteType = "autocomplete" | "select";

// Допустимые значения позиции картинки
export type AutocompleteImageSize = "cover" | "contain";

// Тип данных для выпадающего списка
export interface OptionData {
  key: string;
  title: string;
  subTitle?: string;
  image?: string;
  icon?: string;
  iconColor?: IconColor;
  iconBackground?: IconBackground;
  imagePosition?: AutocompleteImageSize;
  data?: any;
}
