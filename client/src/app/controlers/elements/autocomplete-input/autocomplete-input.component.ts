import { ScrollElement } from "@_datas/app";
import { BaseInputDirective } from "@_directives/base-input.directive";
import { ParseInt } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { CreateRandomID } from "@_helpers/string";
import { CustomObject, IconBackground, IconColor } from "@_models/app";
import { AutocompleteImageSize, AutocompleteType, OptionData } from "@_models/form";
import { ScrollService } from "@_services/scroll.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Optional, Output, Self, ViewChild } from "@angular/core";
import { FormControl, NgControl } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatOption } from "@angular/material/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { TranslateService } from "@ngx-translate/core";
import { Subject, timer } from "rxjs";
import { filter, map, takeUntil } from "rxjs/operators";





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
  @Output() selectItemEvent: EventEmitter<FormControl> = new EventEmitter<FormControl>();

  @ViewChild("layoutElement") layoutElement: ElementRef;
  @ViewChild("field", { read: ElementRef }) field: ElementRef;
  @ViewChild("inputElement") inputElement: ElementRef;
  @ViewChild("autocompleteElement") autocompleteElement: ElementRef;
  @ViewChild("inputElement", { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  optionHasImage: boolean = false;
  optionDataFiltered: OptionData[] = [];
  optionDataSelected: OptionData;

  image: string = "";
  icon: string;
  iconColor: IconColor;
  iconBackground: IconBackground;
  imagePosition: AutocompleteImageSize = "cover";

  private focusTempValue: string;
  private focusClass: string = "mat-focused";

  private autoCompleteID: string = "autocomplete-overlay-" + CreateRandomID(64);

  private destroyed$: Subject<void> = new Subject<void>();





  // Текущая ширина всплывающего списка
  get getPanelWidth(): string | number {
    return this.panelWidth ?? this.layoutElement?.nativeElement.getBoundingClientRect().width ?? null;
  }

  // Отображение в текстовом поле
  displayWith(value: OptionData | string): string {
    let optionData: OptionData = null;
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
  getOptionText(optionData: OptionData): string {
    if (!!optionData) {
      const title: string = this.translateService.instant(optionData.title);
      const subTitle: string = !!optionData?.subTitle?.length
        ? this.textDelimiter + this.translateService.instant(optionData.subTitle)
        : "";
      // Заголовок
      return title + subTitle;
    }
    // No text
    return ""
  }

  // Список классов выпадающего списка
  get autocompleteClassList(): string {
    const classList: CustomObject<boolean> = {
      "autocomplete-overlay": true,
      [this.autoCompleteID]: true,
      "has-image": !!this.image || !!this.icon
    };
    // Вернуть список
    return Object.entries(classList)
      .filter(([, v]) => !!v)
      .map(([k]) => k)
      .join(" ");
  }





  constructor(
    @Optional() @Self() override controlDir: NgControl,
    private changeDetectorRef: ChangeDetectorRef,
    private scrollService: ScrollService,
    private translateService: TranslateService
  ) {
    super(controlDir);
  }

  ngOnChanges(): void {
    this.optionDataFilter();
    this.setValue(this.control.value);
  }

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => {
        this.setValue(value);
        this.optionDataFilter();
      });
    // События
    this.scrollService.onAlwaysScroll()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onScroll());
    // Проверка положения выпадающего списка
    timer(0, 50)
      .pipe(
        map(() => document.getElementsByClassName(this.autoCompleteID)[0] as HTMLElement),
        filter(elm => !!elm),
        takeUntil(this.destroyed$)
      )
      .subscribe(elm => this.onAutoCompleteListOpened(elm));
  }

  ngAfterViewInit(): void {
    this.setValue(this.control.value);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
      const activeOption: MatOption = this.autoComplete.activeOption;
      const optionData: OptionData = activeOption ? activeOption.value : null;
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
    if (!!this.focusTempValue.length) {
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
  private onScroll(): void {
    this.autoComplete.closePanel();
  }

  // Проверка положения выпадающего списка
  private onAutoCompleteListOpened(elm: HTMLElement): void {
    const defaultValue: number = Infinity;
    const field: HTMLElement = this.field.nativeElement;
    const parent: HTMLElement = elm.parentElement;
    const left: number = ParseInt(parent.style.left, defaultValue);
    const right: number = ParseInt(parent.style.right, defaultValue);
    const autoCompleteRight: boolean = left === defaultValue && right !== defaultValue;
    const screenHeight: number = ScrollElement().clientHeight;
    const fieldTop: number = field.getBoundingClientRect().top;
    const top: number = ParseInt(parent.style.top, defaultValue);
    const height: number = parent.getBoundingClientRect().height;
    // Поле справа
    if (autoCompleteRight) {
      elm.classList.add("placed-right");
      elm.classList.remove("placed-left");
    }
    // Поле слева
    else {
      elm.classList.add("placed-left");
      elm.classList.remove("placed-right");
    }
    // Поправить позицию
    if (top + height > screenHeight) {
      const bottom: number = screenHeight - fieldTop;
      // Установить позицию
      parent.style.top = "auto";
      parent.style.bottom = bottom + "px";
      elm.classList.add("placed-bottom");
    }
  }





  // Установить значение
  setValue(valueMixed: OptionData | number | string, setDefault: boolean = true, emitEvent: boolean = false): void {
    let optionData: OptionData = null;
    // Если значение строка
    if (typeof valueMixed === "string" || typeof valueMixed === "number") {
      optionData = this.findByKey(valueMixed.toString());
      // Попробовать поиск по тексту
      if (!optionData) {
        optionData = this.findByTitle(valueMixed.toString());
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
      // Убрать фокус
      WaitObservable(() => document.activeElement !== this.inputElement.nativeElement)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.field.nativeElement.classList.remove(this.focusClass);
          this.inputElement.nativeElement.blur();
        });
    }
    // Оновить
    this.changeDetectorRef.detectChanges();
  }

  // Найти по ключу
  private findByKey(key: string): OptionData {
    if (key && this.optionData.some(option => option.key === key)) {
      return this.optionData.find(option => option.key === key) as OptionData;
    }
    // Ничего не найдено
    return null;
  }

  // Найти по ключу
  private findByTitle(title: string): OptionData {
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
