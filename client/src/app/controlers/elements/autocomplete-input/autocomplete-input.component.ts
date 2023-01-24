import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Optional, Output, Self, ViewChild } from "@angular/core";
import { UntypedFormControl, NgControl } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatOption } from "@angular/material/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { IconBackground, IconColor } from "@_models/app";
import { fromEvent, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-autocomplete-input",
  templateUrl: "./autocomplete-input.component.html",
  styleUrls: ["./autocomplete-input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AutocompleteInputComponent extends BaseInputDirective implements OnInit, OnChanges, AfterViewInit, OnDestroy {


  @Input() type: AutocompleteType = "select";
  @Input() textDelimiter: string = " | ";
  @Input() appearance: MatFormFieldAppearance = "fill";
  @Input() optionData: OptionData[] = [];
  @Input() panelWidth: string | number;
  @Input() buttonIcon: string;
  @Input() defaultIcon: string;
  @Input() defaultIconColor: IconColor = "disabled";
  @Input() defaultIconBackground: IconBackground = "fill";
  @Input() notNull: boolean = true;

  @Output() buttonCallback: EventEmitter<void> = new EventEmitter<void>();
  @Output() selectItemEvent: EventEmitter<UntypedFormControl> = new EventEmitter<UntypedFormControl>();

  @ViewChild("layoutElement") layoutElement: ElementRef;
  @ViewChild("inputElement") inputElement: ElementRef;
  @ViewChild("autocompleteElement") autocompleteElement: ElementRef;
  @ViewChild("inputElement", { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  optionHasImage: boolean = false;
  optionDataFiltered: OptionData[] = [];
  optionDataSelected: OptionData | null;

  image: string = "";
  icon: string;
  iconColor: IconColor;
  iconBackground: IconBackground;
  imagePosition: AutocompleteImageSize = "cover";

  private focusTempValue: string;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущая ширина всплывающего списка
  get getPanelWidth(): string | number {
    return this.panelWidth ?? this.layoutElement?.nativeElement.getBoundingClientRect().width ?? null;
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
    return !!optionData ?
      optionData.title + (optionData.subTitle?.length ? this.textDelimiter + optionData.subTitle : "") :
      "";
  }





  constructor(
    @Optional() @Self() override controlDir: NgControl,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(controlDir);
  }

  ngOnChanges(): void {
    this.optionDataFilter();
    this.setValue(this.control.value);
  }

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.setValue(value);
        this.optionDataFilter();
      });
    // События
    fromEvent(window, "scroll").pipe(takeUntil(this.destroy$)).subscribe(e => this.onScroll(e));
  }

  ngAfterViewInit(): void {
    this.setValue(this.control.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Изменение значения
  onKeyUp(event: KeyboardEvent, value: string): void {
    value = value.toLowerCase();
    // Очистить временное значение фокуса
    this.focusTempValue = "";

    // Поиск значения через Enter
    if (this.optionDataFiltered.length > 0 && (event.key === "Enter" || event.key === "NumpadEnter")) {
      const optionDataFiltered: OptionData[] = this.optionDataFiltered.filter(o => this.getOptionText(o).toLowerCase().includes(value));
      // Установить значение
      optionDataFiltered.length > 0 ?
        this.setValue(optionDataFiltered[0].key, false, true) :
        this.setValue(null, false, true);
      // Закрыть панель
      this.autoComplete.closePanel();
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
    // Фильтрация массива значений
    else {
      this.optionDataFiltered = this.optionData.filter(option => this.getOptionText(option).toLowerCase().includes(value));
      // Установить значение
      this.optionDataFiltered.length === 1 ?
        this.setValue(this.optionDataFiltered[0].key) :
        this.setValue(null, false);
    }
  }

  // Поле в фокусе
  onFocus(): void {
    this.focusTempValue = this.inputElement.nativeElement.value;
    // Очистить для автокомплита
    if (this.type === "autocomplete") {
      this.inputElement.nativeElement.value = "";
    }
    // Убрать фильтрацию
    this.optionDataFiltered = this.optionData;
  }

  // Поле теряет фокус
  onBlur(): void {
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
      this.icon = optionData.icon ? optionData.icon : this.defaultIcon;
      this.iconColor = optionData.iconColor ? optionData.iconColor : this.defaultIconColor;
      this.iconBackground = optionData.iconBackground ? optionData.iconBackground : this.defaultIconBackground;
    }
    // Нет значения
    else {
      this.image = "";
      this.icon = this.defaultIcon;
      this.iconColor = this.defaultIconColor;
      this.iconBackground = this.defaultIconBackground;
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

    // Оновить
    this.changeDetectorRef.detectChanges();
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
    // Оновить
    this.changeDetectorRef.detectChanges();
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
        iconColor: option.iconColor?.length ? option.iconColor : this.defaultIconColor,
        iconBackground: option.iconBackground?.length ? option.iconBackground : this.defaultIconBackground,
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
